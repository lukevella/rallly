import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { decrypt, encrypt } from "@rallly/utils/encryption";
import {
  createUserInDb,
  loginWithEmail,
  upgradeSpaceToPro,
} from "./test-utils";

/**
 * The webhooks settings page: adding an endpoint and revealing its signing
 * secret once, disabling one, deleting one, and the two states that deny
 * access — a member of the space, and a space still on the hobby tier.
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

async function createWebhookInDb({
  spaceId,
  url,
}: {
  spaceId: string;
  url: string;
}) {
  return prisma.spaceWebhook.create({
    data: {
      spaceId,
      url,
      secret: encrypt("whsec_settings_test", SECRET_PASSWORD),
      events: ["poll.closed", "poll.reopened", "poll.scheduled"],
    },
  });
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
    expect(webhook.events.sort()).toEqual([
      "poll.closed",
      "poll.reopened",
      "poll.scheduled",
    ]);
    expect(decryptSecret(webhook.secret)).toBe(revealed);
    // Never replays history: a new endpoint starts at now.
    expect(webhook.cursor.getTime()).toBeGreaterThan(Date.now() - 60_000);

    await page.getByRole("button", { name: "Done" }).click();

    const row = endpointRow(page, url);
    await expect(row).toBeVisible();
    // The row summarises the subscription rather than listing it.
    await expect(row.getByText("3 events")).toBeVisible();
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

  test("shows the last delivery result for an endpoint", async ({ page }) => {
    const { space, email } = await createOwner("webhooks-delivery", {
      pro: true,
    });
    const url = "https://example.com/hooks/delivery";
    const webhook = await createWebhookInDb({ spaceId: space.id, url });
    await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        activityId: `webhooks-settings-${runId}`,
        eventType: "poll.closed",
        payload: { type: "poll.closed" },
        status: "failed",
        attempts: 1,
        lastResponseStatus: 500,
      },
    });

    await gotoWebhooks(page, email);

    await expect(
      endpointRow(page, url).getByText(/Failed .* with 500/),
    ).toBeVisible();
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
