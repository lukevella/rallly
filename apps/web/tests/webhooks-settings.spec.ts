import { createHmac } from "node:crypto";
import type { Server } from "node:http";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { decrypt, encrypt } from "@rallly/utils/encryption";
import {
  MAX_CONSECUTIVE_FAILURES,
  WEBHOOK_VERSION,
} from "@/features/webhook/constants";
import { WEBHOOK_EVENT_TYPES } from "@/features/webhook/schema";
import {
  createUserInDb,
  loginWithEmail,
  upgradeSpaceToPro,
} from "./test-utils";

/**
 * The webhooks settings page: adding an endpoint and revealing its signing
 * secret once, disabling one, deleting one, its health and a test event,
 * and the two states that deny access — a member of the space, and a space
 * still on the hobby tier.
 */

const runId = Date.now().toString(36);
const createdUserIds: string[] = [];
const SECRET_PASSWORD = process.env.SECRET_PASSWORD as string;

// After a page load, React briefly keeps a second hidden copy of the
// streamed page content in a staging <div hidden> under <body>. Text
// locators strict-fail against it, so page text assertions scope to
// #main-content, which only ever holds the live copy.
function mainContent(page: Page) {
  return page.locator("#main-content");
}

async function createOwner(name: string, { pro }: { pro: boolean }) {
  const email = `${name}-${runId}@example.com`;
  const user = await createUserInDb({ email, name });
  createdUserIds.push(user.id);

  const space = await prisma.space.findFirstOrThrow({
    where: { ownerId: user.id },
  });

  if (pro) {
    await upgradeSpaceToPro({ spaceId: space.id, userId: user.id, seats: 1 });
  }

  return { user, space, email };
}

const WEBHOOK_SECRET = "whsec_settings_test";

async function createWebhookInDb({
  spaceId,
  url,
  enabled = true,
  consecutiveFailures = 0,
}: {
  spaceId: string;
  url: string;
  enabled?: boolean;
  consecutiveFailures?: number;
}) {
  return prisma.spaceWebhook.create({
    data: {
      spaceId,
      url,
      secret: encrypt(WEBHOOK_SECRET, SECRET_PASSWORD),
      events: ["poll.closed", "poll.reopened", "poll.scheduled"],
      version: WEBHOOK_VERSION,
      enabled,
      consecutiveFailures,
    },
  });
}

async function createAttemptInDb({
  webhookId,
  status,
  lastResponseStatus,
  lastError,
}: {
  webhookId: string;
  status: "succeeded" | "failed" | "exhausted";
  lastResponseStatus: number | null;
  lastError: string | null;
}) {
  return prisma.webhookDelivery.create({
    data: {
      webhookId,
      activityId: `webhooks-settings-${runId}-${webhookId}`,
      eventType: "poll.closed",
      payload: { type: "poll.closed" },
      status,
      attempts: 1,
      lastResponseStatus,
      lastError,
    },
  });
}

/** A loopback endpoint answering every request with `status`. */
async function startReceiver(status: number) {
  const requests: { headers: Record<string, unknown>; body: string }[] = [];
  const server: Server = createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      requests.push({ headers: req.headers, body });
      res.statusCode = status;
      res.end();
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}/hook`,
    requests,
    stop: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

function decryptSecret(stored: string) {
  return decrypt(stored, SECRET_PASSWORD);
}

async function gotoWebhooks(page: Page, email: string) {
  await loginWithEmail(page, { email });
  await page.goto("/settings/webhooks");
}

function endpointRow(page: Page, url: string) {
  return page.getByRole("listitem").filter({ hasText: url });
}

test.afterAll(async () => {
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({
      where: { id: { in: createdUserIds } },
    });
  }
});

test.describe("Webhooks settings", () => {
  test("adds an endpoint and reveals the signing secret once", async ({
    page,
  }) => {
    const { space, email } = await createOwner("webhooks-create", {
      pro: true,
    });
    await gotoWebhooks(page, email);

    await expect(
      mainContent(page).getByText("No webhooks found"),
    ).toBeVisible();

    await page.getByRole("button", { name: "Add webhook" }).click();
    const url = "https://example.com/hooks/rallly";
    await page.getByLabel("URL").fill(url);
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Add webhook" })
      .click();

    // The secret is shown once, and it is the real one: what the dialog
    // displays must decrypt back out of the row the dispatcher signs with.
    const secretField = page.getByLabel("Signing secret");
    await expect(secretField).toBeVisible();
    const revealed = await secretField.inputValue();
    expect(revealed).toMatch(/^whsec_/);

    const webhook = await prisma.spaceWebhook.findFirstOrThrow({
      where: { spaceId: space.id },
    });
    expect(webhook.url).toBe(url);
    expect(webhook.enabled).toBe(true);
    // Pinned at creation, so a later version bump cannot move an endpoint
    // that was built against this one.
    expect(webhook.version).toBe(WEBHOOK_VERSION);
    // The form starts with every event selected.
    expect([...webhook.events].sort()).toEqual([...WEBHOOK_EVENT_TYPES].sort());
    expect(decryptSecret(webhook.secret)).toBe(revealed);
    // Never replays history: a new endpoint starts at now.
    expect(webhook.cursor.getTime()).toBeGreaterThan(Date.now() - 60_000);

    await page.getByRole("button", { name: "Done" }).click();

    const row = endpointRow(page, url);
    await expect(row).toBeVisible();
    // The row summarises the subscription rather than listing it.
    await expect(
      row.getByText(`${WEBHOOK_EVENT_TYPES.length} events`),
    ).toBeVisible();
    // Closing the reveal is the only chance to copy it — reloading must not
    // surface the secret again.
    await page.reload();
    await expect(mainContent(page).getByText(revealed)).toHaveCount(0);
  });

  test("rejects an endpoint that is not a public https URL", async ({
    page,
  }) => {
    const { space, email } = await createOwner("webhooks-invalid", {
      pro: true,
    });
    await gotoWebhooks(page, email);

    await page.getByRole("button", { name: "Add webhook" }).click();
    await page.getByLabel("URL").fill("http://localhost:3000/hook");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Add webhook" })
      .click();

    await expect(page.getByText("Webhook URLs must use https")).toBeVisible();
    expect(
      await prisma.spaceWebhook.count({ where: { spaceId: space.id } }),
    ).toBe(0);
  });

  test("disables an endpoint", async ({ page }) => {
    const { space, email } = await createOwner("webhooks-disable", {
      pro: true,
    });
    const url = "https://example.com/hooks/disable";
    const webhook = await createWebhookInDb({ spaceId: space.id, url });

    await gotoWebhooks(page, email);

    const row = endpointRow(page, url);
    const toggle = row.getByRole("switch", { name: "Enabled" });
    await expect(toggle).toBeChecked();
    await toggle.click();

    await expect(toggle).not.toBeChecked();
    expect(
      (
        await prisma.spaceWebhook.findUniqueOrThrow({
          where: { id: webhook.id },
        })
      ).enabled,
    ).toBe(false);
  });

  test("deletes an endpoint", async ({ page }) => {
    const { space, email } = await createOwner("webhooks-delete", {
      pro: true,
    });
    const url = "https://example.com/hooks/delete";
    await createWebhookInDb({ spaceId: space.id, url });

    await gotoWebhooks(page, email);

    const row = endpointRow(page, url);
    await row.getByRole("button", { name: "More options" }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete" })
      .click();

    await expect(
      mainContent(page).getByText("No webhooks found"),
    ).toBeVisible();
    expect(
      await prisma.spaceWebhook.count({ where: { spaceId: space.id } }),
    ).toBe(0);
  });

  test("shows a failing endpoint and its last error in place", async ({
    page,
  }) => {
    const { space, email } = await createOwner("webhooks-failing", {
      pro: true,
    });
    const url = "https://example.com/hooks/failing";
    const webhook = await createWebhookInDb({ spaceId: space.id, url });
    // A retry is still scheduled, so nothing has exhausted yet: the failed
    // attempt alone is what marks the endpoint failing.
    await createAttemptInDb({
      webhookId: webhook.id,
      status: "failed",
      lastResponseStatus: 500,
      lastError: "HTTP 500",
    });

    await gotoWebhooks(page, email);

    await endpointRow(page, url)
      .getByRole("button", { name: "Failing" })
      .click();
    const popover = page.getByRole("dialog");
    await expect(popover.getByText("Last attempt failed")).toBeVisible();
    await expect(popover.getByText(/returned 500/)).toBeVisible();
    await expect(popover.getByText("HTTP 500")).toBeVisible();
  });

  test("tells an endpoint Rallly turned off apart from one the owner did", async ({
    page,
  }) => {
    const { space, email } = await createOwner("webhooks-turned-off", {
      pro: true,
    });
    const turnedOffUrl = "https://example.com/hooks/turned-off";
    const turnedOff = await createWebhookInDb({
      spaceId: space.id,
      url: turnedOffUrl,
      enabled: false,
      consecutiveFailures: MAX_CONSECUTIVE_FAILURES,
    });
    await createAttemptInDb({
      webhookId: turnedOff.id,
      status: "exhausted",
      lastResponseStatus: null,
      lastError: "getaddrinfo ENOTFOUND example.invalid",
    });
    const switchedOffUrl = "https://example.com/hooks/switched-off";
    await createWebhookInDb({
      spaceId: space.id,
      url: switchedOffUrl,
      enabled: false,
    });

    await gotoWebhooks(page, email);

    // The owner's own choice is the switch; nothing repeats it.
    await expect(
      endpointRow(page, switchedOffUrl).getByRole("button", {
        name: "Turned off after failures",
      }),
    ).toHaveCount(0);

    await endpointRow(page, turnedOffUrl)
      .getByRole("button", { name: "Turned off after failures" })
      .click();
    const popover = page.getByRole("dialog");
    await expect(popover.getByText("Turned off by Rallly")).toBeVisible();
    await expect(
      popover.getByText("getaddrinfo ENOTFOUND example.invalid"),
    ).toBeVisible();

    // Turning it back on clears the count, so it is no longer shown as
    // turned off by Rallly.
    await page.keyboard.press("Escape");
    await endpointRow(page, turnedOffUrl)
      .getByRole("switch", { name: "Enabled" })
      .click();
    await expect
      .poll(
        async () =>
          (
            await prisma.spaceWebhook.findUniqueOrThrow({
              where: { id: turnedOff.id },
            })
          ).consecutiveFailures,
      )
      .toBe(0);
  });

  test("sends a signed test event and reports the response", async ({
    page,
  }) => {
    const receiver = await startReceiver(204);
    try {
      const { space, email } = await createOwner("webhooks-test-event", {
        pro: true,
      });
      const webhook = await createWebhookInDb({
        spaceId: space.id,
        url: receiver.url,
        consecutiveFailures: 3,
      });

      await gotoWebhooks(page, email);

      await endpointRow(page, receiver.url)
        .getByRole("button", { name: "More options" })
        .click();
      await page.getByRole("menuitem", { name: "Send test event" }).click();

      await expect(page.getByText("Test event delivered")).toBeVisible();
      await expect(page.getByText("Endpoint responded 204")).toBeVisible();

      expect(receiver.requests).toHaveLength(1);
      const [request] = receiver.requests;
      const body = JSON.parse(request?.body ?? "{}");
      expect(body).toMatchObject({
        version: WEBHOOK_VERSION,
        type: "ping",
        data: {},
      });
      expect(request?.headers["x-rallly-event"]).toBe("ping");
      const [t, v1] = String(request?.headers["x-rallly-signature"])
        .split(",")
        .map((part) => part.split("=")[1]);
      expect(v1).toBe(
        createHmac("sha256", WEBHOOK_SECRET)
          .update(`${t}.${request?.body}`)
          .digest("hex"),
      );

      const delivery = await prisma.webhookDelivery.findFirstOrThrow({
        where: { webhookId: webhook.id },
      });
      expect(delivery).toMatchObject({
        eventType: "ping",
        status: "succeeded",
        attempts: 1,
        lastResponseStatus: 204,
      });
      // A success is a success: it clears the count like any delivery.
      expect(
        (
          await prisma.spaceWebhook.findUniqueOrThrow({
            where: { id: webhook.id },
          })
        ).consecutiveFailures,
      ).toBe(0);
    } finally {
      await receiver.stop();
    }
  });

  test("a successful test event keeps an endpoint Rallly turned off marked as such", async ({
    page,
  }) => {
    const receiver = await startReceiver(204);
    try {
      const { space, email } = await createOwner("webhooks-test-off", {
        pro: true,
      });
      const webhook = await createWebhookInDb({
        spaceId: space.id,
        url: receiver.url,
        enabled: false,
        consecutiveFailures: MAX_CONSECUTIVE_FAILURES,
      });

      await gotoWebhooks(page, email);

      await endpointRow(page, receiver.url)
        .getByRole("button", { name: "More options" })
        .click();
      await page.getByRole("menuitem", { name: "Send test event" }).click();
      await expect(page.getByText("Test event delivered")).toBeVisible();

      // The count is what tells a dispatcher disable from an owner disable,
      // so only turning the endpoint back on clears it.
      const after = await prisma.spaceWebhook.findUniqueOrThrow({
        where: { id: webhook.id },
      });
      expect(after.enabled).toBe(false);
      expect(after.consecutiveFailures).toBe(MAX_CONSECUTIVE_FAILURES);
      await expect(
        endpointRow(page, receiver.url).getByRole("button", {
          name: "Turned off after failures",
        }),
      ).toBeVisible();
    } finally {
      await receiver.stop();
    }
  });

  test("a failed test event does not count against the endpoint", async ({
    page,
  }) => {
    const receiver = await startReceiver(503);
    try {
      const { space, email } = await createOwner("webhooks-test-fail", {
        pro: true,
      });
      // One exhausted event short of being turned off: a test must not be
      // what tips it over.
      const webhook = await createWebhookInDb({
        spaceId: space.id,
        url: receiver.url,
        consecutiveFailures: MAX_CONSECUTIVE_FAILURES - 1,
      });

      await gotoWebhooks(page, email);

      await endpointRow(page, receiver.url)
        .getByRole("button", { name: "More options" })
        .click();
      await page.getByRole("menuitem", { name: "Send test event" }).click();

      await expect(page.getByText("Test event failed")).toBeVisible();
      expect(receiver.requests).toHaveLength(1);

      const after = await prisma.spaceWebhook.findUniqueOrThrow({
        where: { id: webhook.id },
      });
      expect(after.enabled).toBe(true);
      expect(after.consecutiveFailures).toBe(MAX_CONSECUTIVE_FAILURES - 1);

      // Recorded as exhausted, never as a failure awaiting retry, so the
      // dispatcher leaves it alone.
      const delivery = await prisma.webhookDelivery.findFirstOrThrow({
        where: { webhookId: webhook.id },
      });
      expect(delivery).toMatchObject({
        eventType: "ping",
        status: "exhausted",
        lastResponseStatus: 503,
        lastError: "HTTP 503",
      });

      await expect(
        endpointRow(page, receiver.url).getByRole("button", {
          name: "Failing",
        }),
      ).toBeVisible();
    } finally {
      await receiver.stop();
    }
  });

  test("a member of the space cannot reach the page", async ({ page }) => {
    const { space } = await createOwner("webhooks-owner", { pro: true });
    const memberEmail = `webhooks-member-${runId}@example.com`;
    const member = await createUserInDb({
      email: memberEmail,
      name: "webhooks-member",
    });
    createdUserIds.push(member.id);
    await prisma.spaceMember.create({
      data: { spaceId: space.id, userId: member.id, role: "MEMBER" },
    });
    // The active space is the membership selected most recently, and both
    // default to now — back-date the member's own space so the pro one wins
    // deterministically.
    await prisma.spaceMember.updateMany({
      where: { userId: member.id, spaceId: { not: space.id } },
      data: { lastSelectedAt: new Date(Date.now() - 60_000) },
    });

    await loginWithEmail(page, { email: memberEmail });
    // The nav entry is owner-only, so the member has to arrive by deep link.
    await expect(page.getByRole("link", { name: "Webhooks" })).toHaveCount(0);

    await page.goto("/settings/webhooks");

    // A member has no self-serve path to webhooks, so this is a denial, not
    // an upsell — the pay wall would tell them to buy something the space
    // already has. Asserted on the rendered body rather than the HTTP
    // status: the shell streams before notFound() resolves, so the response
    // is a 200 carrying the 404 page.
    await expect(mainContent(page).getByText("Page not found")).toBeVisible();
    await expect(
      mainContent(page).getByText("Upgrade for webhooks"),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Add webhook" })).toHaveCount(
      0,
    );
  });

  test("a hobby space sees the pay wall instead of the list", async ({
    page,
  }) => {
    const { email } = await createOwner("webhooks-hobby", { pro: false });
    await gotoWebhooks(page, email);

    await expect(
      mainContent(page).getByText("Upgrade for webhooks"),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Add webhook" })).toHaveCount(
      0,
    );

    await page.getByRole("button", { name: "Upgrade to Pro" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
