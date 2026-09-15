import { createHmac } from "node:crypto";
import type { Server } from "node:http";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { APIRequestContext } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { prisma } from "@rallly/database";
import { encrypt } from "@rallly/utils/encryption";
import { createUserInDb } from "./test-utils";

/**
 * Drives the webhook dispatcher cron against a local receiver: fan-out from
 * the poll activity log, signed delivery, retry with backoff, exhaustion,
 * cursor lag, reclaiming orphaned in-flight rows and disabling an endpoint
 * that keeps failing. The receiver is loopback, which the sender normally
 * refuses; .env.test sets WEBHOOK_ALLOW_PRIVATE_URLS for exactly this.
 */

const CRON_SECRET = process.env.CRON_SECRET;
const SECRET_PASSWORD = process.env.SECRET_PASSWORD as string;
const WEBHOOK_SECRET = "whsec_integration_test";

type ReceivedRequest = {
  headers: Record<string, string | string[] | undefined>;
  body: string;
};

class Receiver {
  readonly requests: ReceivedRequest[] = [];
  status = 200;
  private server: Server | null = null;
  url = "";

  async start() {
    this.server = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        this.requests.push({ headers: req.headers, body });
        res.statusCode = this.status;
        res.end();
      });
    });
    await new Promise<void>((resolve) =>
      this.server?.listen(0, "127.0.0.1", resolve),
    );
    const { port } = this.server?.address() as AddressInfo;
    this.url = `http://127.0.0.1:${port}/hook`;
  }

  async stop() {
    await new Promise<void>((resolve) => this.server?.close(() => resolve()));
  }
}

function secondsAgo(seconds: number) {
  return new Date(Date.now() - seconds * 1000);
}

function verifySignature(header: string, body: string) {
  const [t, v1] = header.split(",").map((part) => part.split("=")[1]);
  const expected = createHmac("sha256", WEBHOOK_SECRET)
    .update(`${t}.${body}`)
    .digest("hex");
  return v1 === expected;
}

test.describe("Webhook delivery", () => {
  const receiver = new Receiver();
  const createdUserIds: string[] = [];
  let spaceId: string;
  let pollId: string;

  async function runCron(request: APIRequestContext) {
    const response = await request.get("/api/house-keeping/deliver-webhooks", {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    return data.summary as Record<string, number>;
  }

  async function createWebhook(overrides: { events?: string[] } = {}) {
    return prisma.spaceWebhook.create({
      data: {
        spaceId,
        url: receiver.url,
        secret: encrypt(WEBHOOK_SECRET, SECRET_PASSWORD),
        events: overrides.events ?? [
          "poll.closed",
          "poll.reopened",
          "poll.scheduled",
        ],
        cursor: secondsAgo(120),
      },
    });
  }

  async function createActivity({
    type,
    payload,
    createdAt,
    optionId,
  }: {
    type: string;
    payload: object;
    createdAt: Date;
    optionId?: string;
  }) {
    return prisma.pollActivity.create({
      data: { pollId, type, payload, createdAt, optionId },
    });
  }

  test.beforeAll(async () => {
    await receiver.start();
    await prisma.user.deleteMany({
      where: { email: { startsWith: "webhook-delivery-" } },
    });
    const owner = await createUserInDb({
      name: "Webhook Owner",
      email: "webhook-delivery-owner@example.com",
    });
    createdUserIds.push(owner.id);
    const space = await prisma.space.findFirstOrThrow({
      where: { ownerId: owner.id },
    });
    spaceId = space.id;
    const poll = await prisma.poll.create({
      data: {
        id: "webhook-delivery-poll",
        title: "Webhook poll",
        kind: "time",
        timeZone: "Europe/London",
        userId: owner.id,
        spaceId,
      },
    });
    pollId = poll.id;
  });

  test.beforeEach(async () => {
    receiver.requests.length = 0;
    receiver.status = 200;
    await prisma.spaceWebhook.deleteMany({ where: { spaceId } });
    await prisma.pollActivity.deleteMany({ where: { pollId } });
  });

  test.afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await receiver.stop();
  });

  test("fans out a closed poll into a signed delivery, once", async ({
    request,
  }) => {
    const webhook = await createWebhook();
    const activity = await createActivity({
      type: "poll_closed",
      payload: { reason: "manual" },
      createdAt: secondsAgo(30),
    });
    // Not a webhook event: must not produce a delivery
    await createActivity({
      type: "response_created",
      payload: { name: "Jessie" },
      createdAt: secondsAgo(30),
    });

    const summary = await runCron(request);
    expect(summary.fannedOut).toBe(1);
    expect(summary.succeeded).toBe(1);

    expect(receiver.requests).toHaveLength(1);
    const [received] = receiver.requests;
    expect(received?.headers["x-rallly-event"]).toBe("poll.closed");
    expect(received?.headers["content-type"]).toBe("application/json");
    const signature = received?.headers["x-rallly-signature"] as string;
    expect(verifySignature(signature, received?.body ?? "")).toBe(true);

    const body = JSON.parse(received?.body ?? "{}");
    expect(body).toMatchObject({
      id: activity.id,
      type: "poll.closed",
      createdAt: activity.createdAt.toISOString(),
      data: {
        poll: {
          id: pollId,
          title: "Webhook poll",
          status: "closed",
          kind: "time",
          timeZone: "Europe/London",
        },
        reason: "manual",
      },
    });

    const delivery = await prisma.webhookDelivery.findUniqueOrThrow({
      where: {
        webhookId_activityId: {
          webhookId: webhook.id,
          activityId: activity.id,
        },
      },
    });
    expect(received?.headers["x-rallly-delivery"]).toBe(delivery.id);
    expect(delivery.status).toBe("succeeded");
    expect(delivery.attempts).toBe(1);
    expect(delivery.lastResponseStatus).toBe(200);

    const updated = await prisma.spaceWebhook.findUniqueOrThrow({
      where: { id: webhook.id },
    });
    expect(updated.lastDeliveredAt).not.toBeNull();
    expect(updated.cursor.getTime()).toBeGreaterThan(
      activity.createdAt.getTime(),
    );

    // A second run finds nothing new and sends nothing again
    const again = await runCron(request);
    expect(again.fannedOut).toBe(0);
    expect(receiver.requests).toHaveLength(1);
  });

  test("delivers only subscribed events and skips disabled endpoints", async ({
    request,
  }) => {
    const closedOnly = await createWebhook({ events: ["poll.closed"] });
    const disabled = await createWebhook();
    await prisma.spaceWebhook.update({
      where: { id: disabled.id },
      data: { enabled: false },
    });
    await createActivity({
      type: "poll_reopened",
      payload: {},
      createdAt: secondsAgo(30),
    });

    const summary = await runCron(request);
    expect(summary.fannedOut).toBe(0);
    expect(receiver.requests).toHaveLength(0);
    expect(
      await prisma.webhookDelivery.count({
        where: { webhookId: { in: [closedOnly.id, disabled.id] } },
      }),
    ).toBe(0);
  });

  test("carries the scheduled option for a scheduled poll", async ({
    request,
  }) => {
    await createWebhook();
    await createActivity({
      type: "poll_scheduled",
      optionId: "webhook-delivery-option",
      payload: { start: "2026-10-01T09:00:00.000Z", duration: 30 },
      createdAt: secondsAgo(30),
    });

    await runCron(request);

    expect(receiver.requests).toHaveLength(1);
    expect(JSON.parse(receiver.requests[0]?.body ?? "{}")).toMatchObject({
      type: "poll.scheduled",
      data: {
        poll: { status: "scheduled" },
        option: {
          id: "webhook-delivery-option",
          startTime: "2026-10-01T09:00:00.000Z",
          duration: 30,
        },
      },
    });
  });

  test("picks up an activity that committed behind the cursor", async ({
    request,
  }) => {
    // Cursor is 120s back; a row whose transaction started earlier but
    // committed late is inside the overlap window and must still fan out.
    await createWebhook();
    const late = await createActivity({
      type: "poll_closed",
      payload: { reason: "auto" },
      createdAt: secondsAgo(200),
    });

    const summary = await runCron(request);
    expect(summary.fannedOut).toBe(1);
    expect(JSON.parse(receiver.requests[0]?.body ?? "{}").id).toBe(late.id);
  });

  test("leaves activities inside the fan-out lag for the next run", async ({
    request,
  }) => {
    const webhook = await createWebhook();
    const activity = await createActivity({
      type: "poll_closed",
      payload: { reason: "auto" },
      createdAt: new Date(),
    });

    const summary = await runCron(request);
    expect(summary.fannedOut).toBe(0);
    expect(receiver.requests).toHaveLength(0);

    const updated = await prisma.spaceWebhook.findUniqueOrThrow({
      where: { id: webhook.id },
    });
    expect(updated.cursor.getTime()).toBeLessThan(activity.createdAt.getTime());
  });

  test("schedules a retry after a failed attempt and succeeds on the next", async ({
    request,
  }) => {
    const webhook = await createWebhook();
    const activity = await createActivity({
      type: "poll_closed",
      payload: { reason: "manual" },
      createdAt: secondsAgo(30),
    });
    receiver.status = 500;

    const first = await runCron(request);
    expect(first.failed).toBe(1);

    const where = {
      webhookId_activityId: { webhookId: webhook.id, activityId: activity.id },
    };
    const failed = await prisma.webhookDelivery.findUniqueOrThrow({ where });
    expect(failed.status).toBe("failed");
    expect(failed.attempts).toBe(1);
    expect(failed.lastResponseStatus).toBe(500);
    const delay = failed.nextAttemptAt.getTime() - Date.now();
    expect(delay).toBeGreaterThan(45_000);
    expect(delay).toBeLessThanOrEqual(60_000);
    expect(
      (
        await prisma.spaceWebhook.findUniqueOrThrow({
          where: { id: webhook.id },
        })
      ).lastFailedAt,
    ).not.toBeNull();

    // Not due yet: the next run must not retry it
    const notDue = await runCron(request);
    expect(notDue.failed + notDue.succeeded).toBe(0);
    expect(receiver.requests).toHaveLength(1);

    await prisma.webhookDelivery.update({
      where,
      data: { nextAttemptAt: secondsAgo(1) },
    });
    receiver.status = 200;

    const second = await runCron(request);
    expect(second.succeeded).toBe(1);
    const succeeded = await prisma.webhookDelivery.findUniqueOrThrow({ where });
    expect(succeeded.status).toBe("succeeded");
    expect(succeeded.attempts).toBe(2);
    expect(receiver.requests).toHaveLength(2);
    // The retry resends the same event id
    expect(JSON.parse(receiver.requests[1]?.body ?? "{}").id).toBe(activity.id);
  });

  test("exhausts a delivery after the final attempt and disables the endpoint after 20 in a row", async ({
    request,
  }) => {
    const webhook = await createWebhook();
    await prisma.spaceWebhook.update({
      where: { id: webhook.id },
      data: { consecutiveFailures: 18 },
    });
    const makeExhausting = async (activityId: string) =>
      prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          activityId,
          eventType: "poll.closed",
          payload: { id: activityId, type: "poll.closed" },
          status: "failed",
          attempts: 5,
          nextAttemptAt: secondsAgo(1),
        },
      });
    const nineteenth = await makeExhausting("webhook-delivery-exhaust-1");
    receiver.status = 503;

    const first = await runCron(request);
    expect(first.exhausted).toBe(1);
    expect(
      (
        await prisma.webhookDelivery.findUniqueOrThrow({
          where: { id: nineteenth.id },
        })
      ).status,
    ).toBe("exhausted");
    let updated = await prisma.spaceWebhook.findUniqueOrThrow({
      where: { id: webhook.id },
    });
    expect(updated.consecutiveFailures).toBe(19);
    expect(updated.enabled).toBe(true);

    await makeExhausting("webhook-delivery-exhaust-2");
    const second = await runCron(request);
    expect(second.exhausted).toBe(1);
    expect(second.disabled).toBe(1);
    updated = await prisma.spaceWebhook.findUniqueOrThrow({
      where: { id: webhook.id },
    });
    expect(updated.consecutiveFailures).toBe(20);
    expect(updated.enabled).toBe(false);
  });

  test("a success resets the consecutive failure count", async ({
    request,
  }) => {
    const webhook = await createWebhook();
    await prisma.spaceWebhook.update({
      where: { id: webhook.id },
      data: { consecutiveFailures: 7 },
    });
    await createActivity({
      type: "poll_reopened",
      payload: {},
      createdAt: secondsAgo(30),
    });

    await runCron(request);

    expect(
      (
        await prisma.spaceWebhook.findUniqueOrThrow({
          where: { id: webhook.id },
        })
      ).consecutiveFailures,
    ).toBe(0);
  });

  test("reclaims in-flight deliveries orphaned by a dead run", async ({
    request,
  }) => {
    const webhook = await createWebhook();
    const payload = { id: "x", type: "poll.closed" };
    const orphaned = await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        activityId: "webhook-delivery-orphaned",
        eventType: "poll.closed",
        payload,
        status: "in_flight",
        attempts: 1,
        updatedAt: secondsAgo(3 * 60),
      },
    });
    const live = await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        activityId: "webhook-delivery-live",
        eventType: "poll.closed",
        payload,
        status: "in_flight",
        attempts: 1,
      },
    });

    const summary = await runCron(request);
    expect(summary.reclaimed).toBe(1);
    expect(summary.succeeded).toBe(1);

    const delivered = await prisma.webhookDelivery.findUniqueOrThrow({
      where: { id: orphaned.id },
    });
    expect(delivered.status).toBe("succeeded");
    expect(delivered.attempts).toBe(2);
    expect(
      (
        await prisma.webhookDelivery.findUniqueOrThrow({
          where: { id: live.id },
        })
      ).status,
    ).toBe("in_flight");
  });
});
