import "server-only";

import type { Prisma } from "@rallly/database";
import { prisma } from "@rallly/database";
import { decrypt } from "@rallly/utils/encryption";
import { env } from "@/env";
import {
  DELIVERY_CLAIM_BATCH_SIZE,
  DELIVERY_CONCURRENCY,
  FAN_OUT_BATCH_SIZE,
  FAN_OUT_LAG_MS,
  FAN_OUT_OVERLAP_MS,
  IN_FLIGHT_TIMEOUT_MS,
  MAX_CONSECUTIVE_FAILURES,
  MAX_DELIVERY_ATTEMPTS,
} from "./constants";
import {
  listDueDeliveryIds,
  listEnabledWebhooks,
  listWebhookActivities,
} from "./data";
import type { WebhookEventType } from "./schema";
import type { WebhookSendResult } from "./service";
import { sendWebhook } from "./service";
import {
  buildWebhookPayload,
  getRetryDelayMs,
  toWebhookEventType,
} from "./utils";

/**
 * Turns new activity into delivery rows, one per (webhook, activity). The
 * unique constraint makes re-reading harmless, so every run re-reads an
 * overlap window behind the cursor and the cursor only advances to the lag
 * boundary once a webhook's backlog is drained. Within a run, pages follow a
 * `(createdAt, id)` keyset until the backlog is drained: the persisted cursor
 * is a timestamp, so a run that stopped early would restart at the overlap
 * and never get past a window larger than what it reads. Each page commits
 * with its cursor, so a crash resumes from the last page, not the start.
 * Returns the number of deliveries created.
 */
export async function fanOutWebhookEvents({ now }: { now: Date }) {
  const until = new Date(now.getTime() - FAN_OUT_LAG_MS);
  let created = 0;

  for (const webhook of await listEnabledWebhooks()) {
    if (webhook.cursor >= until) {
      continue;
    }

    let after: { createdAt: Date; id?: string } = {
      createdAt: new Date(webhook.cursor.getTime() - FAN_OUT_OVERLAP_MS),
    };

    for (;;) {
      const activities = await listWebhookActivities({
        spaceId: webhook.spaceId,
        after,
        until,
        limit: FAN_OUT_BATCH_SIZE,
      });

      const deliveries = activities.flatMap((activity) => {
        const eventType = toWebhookEventType(activity.type);
        if (!eventType || !webhook.events.includes(eventType)) {
          return [];
        }
        const payload = buildWebhookPayload({ activity, poll: activity.poll });
        return payload
          ? [
              {
                webhookId: webhook.id,
                activityId: activity.id,
                eventType,
                payload: payload as unknown as Prisma.InputJsonObject,
                // The run's own clock, not the database default: the claim
                // that follows in the same run compares against this instant.
                nextAttemptAt: now,
              },
            ]
          : [];
      });

      const last = activities.at(-1);
      const drained = activities.length < FAN_OUT_BATCH_SIZE || !last;
      // A partial page means the boundary was reached; a full one stops at
      // its last row, and the overlap covers anything that lands behind it.
      const cursor = drained ? until : last.createdAt;

      const [result] = await prisma.$transaction([
        prisma.webhookDelivery.createMany({
          data: deliveries,
          skipDuplicates: true,
        }),
        prisma.spaceWebhook.update({
          where: { id: webhook.id },
          data: { cursor },
        }),
      ]);
      created += result.count;

      if (drained) {
        break;
      }
      after = { createdAt: last.createdAt, id: last.id };
    }
  }

  return created;
}

/**
 * Returns in-flight deliveries abandoned by a run that died mid-send to the
 * queue. The attempt was already counted at claim time, so a delivery that
 * keeps dying still exhausts instead of looping forever.
 */
export async function reclaimStaleDeliveries({ now }: { now: Date }) {
  const staleBefore = new Date(now.getTime() - IN_FLIGHT_TIMEOUT_MS);
  const [exhausted, reclaimed] = await prisma.$transaction([
    prisma.webhookDelivery.updateMany({
      where: {
        status: "in_flight",
        updatedAt: { lt: staleBefore },
        attempts: { gte: MAX_DELIVERY_ATTEMPTS },
      },
      data: { status: "exhausted", lastError: "Delivery run did not finish" },
    }),
    prisma.webhookDelivery.updateMany({
      where: { status: "in_flight", updatedAt: { lt: staleBefore } },
      data: { status: "pending" },
    }),
  ]);
  return exhausted.count + reclaimed.count;
}

/**
 * Claims due deliveries for this run. Each claim is a conditional update on
 * one row, so two overlapping runs never send the same delivery: whichever
 * flips it to in_flight owns it. Counting the attempt here rather than on
 * completion means a run that dies after sending still used an attempt.
 */
export async function claimDueDeliveries({
  now,
  limit,
}: {
  now: Date;
  limit: number;
}) {
  const claimed: string[] = [];
  for (const id of await listDueDeliveryIds({ now, limit })) {
    const { count } = await prisma.webhookDelivery.updateMany({
      where: {
        id,
        status: { in: ["pending", "failed"] },
        nextAttemptAt: { lte: now },
        // Re-checked here, not only when listing candidates: another run
        // may have disabled the endpoint in between.
        webhook: { enabled: true },
      },
      data: { status: "in_flight", attempts: { increment: 1 } },
    });
    if (count === 1) {
      claimed.push(id);
    }
  }

  return prisma.webhookDelivery.findMany({
    where: { id: { in: claimed } },
    select: {
      id: true,
      eventType: true,
      payload: true,
      attempts: true,
      webhook: { select: { id: true, url: true, secret: true } },
    },
  });
}

export type DeliveryOutcome = "succeeded" | "failed" | "exhausted" | "disabled";

/**
 * Records an attempt's outcome on the delivery and its endpoint. A failure
 * with schedule left is re-queued with backoff; past the schedule it is
 * exhausted and counts against the endpoint, which is disabled once too
 * many exhaust in a row. Any success resets that count.
 */
export async function recordDeliveryResult({
  deliveryId,
  webhookId,
  attempts,
  result,
  now,
}: {
  deliveryId: string;
  webhookId: string;
  attempts: number;
  result: WebhookSendResult;
  now: Date;
}): Promise<DeliveryOutcome> {
  return prisma.$transaction(async (tx) => {
    if (result.ok) {
      await tx.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "succeeded",
          lastResponseStatus: result.status,
          lastError: null,
        },
      });
      await tx.spaceWebhook.update({
        where: { id: webhookId },
        data: { lastDeliveredAt: now, consecutiveFailures: 0 },
      });
      return "succeeded";
    }

    const delay = getRetryDelayMs(attempts);
    if (delay !== null) {
      await tx.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "failed",
          nextAttemptAt: new Date(now.getTime() + delay),
          lastResponseStatus: result.status,
          lastError: result.error,
        },
      });
      await tx.spaceWebhook.update({
        where: { id: webhookId },
        data: { lastFailedAt: now },
      });
      return "failed";
    }

    await tx.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "exhausted",
        lastResponseStatus: result.status,
        lastError: result.error,
      },
    });
    const webhook = await tx.spaceWebhook.update({
      where: { id: webhookId },
      data: { lastFailedAt: now, consecutiveFailures: { increment: 1 } },
      select: { enabled: true, consecutiveFailures: true },
    });
    if (
      webhook.enabled &&
      webhook.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES
    ) {
      await tx.spaceWebhook.update({
        where: { id: webhookId },
        data: { enabled: false },
      });
      return "disabled";
    }
    return "exhausted";
  });
}

/**
 * Every failure mode ends in a result: a delivery is already in flight by
 * now, and a throw here would leave it stranded until stale reclamation.
 */
async function attemptDelivery(delivery: {
  id: string;
  eventType: string;
  payload: Prisma.JsonValue;
  webhook: { url: string; secret: string };
}): Promise<WebhookSendResult> {
  let secret: string;
  try {
    secret = decrypt(delivery.webhook.secret, env.SECRET_PASSWORD);
  } catch {
    return {
      ok: false,
      status: null,
      error: "Could not decrypt the endpoint secret",
    };
  }
  return sendWebhook({
    url: delivery.webhook.url,
    secret,
    deliveryId: delivery.id,
    eventType: delivery.eventType as WebhookEventType,
    body: JSON.stringify(delivery.payload),
  });
}

export type DeliverWebhooksSummary = {
  reclaimed: number;
  fannedOut: number;
  attempted: number;
  succeeded: number;
  failed: number;
  exhausted: number;
  disabled: number;
};

/**
 * One dispatcher run: recover orphans, fan out new activity, then send what
 * is due. Sends run a few at a time so a slow endpoint cannot hold the whole
 * batch to its timeout, and every outcome is recorded before the run ends.
 */
export async function deliverWebhooks({
  now = new Date(),
}: {
  now?: Date;
} = {}): Promise<DeliverWebhooksSummary> {
  const summary: DeliverWebhooksSummary = {
    reclaimed: 0,
    fannedOut: 0,
    attempted: 0,
    succeeded: 0,
    failed: 0,
    exhausted: 0,
    disabled: 0,
  };

  summary.reclaimed = await reclaimStaleDeliveries({ now });
  summary.fannedOut = await fanOutWebhookEvents({ now });

  const deliveries = await claimDueDeliveries({
    now,
    limit: DELIVERY_CLAIM_BATCH_SIZE,
  });
  summary.attempted = deliveries.length;

  for (let i = 0; i < deliveries.length; i += DELIVERY_CONCURRENCY) {
    const outcomes = await Promise.all(
      deliveries.slice(i, i + DELIVERY_CONCURRENCY).map(async (delivery) => {
        const result = await attemptDelivery(delivery);
        return recordDeliveryResult({
          deliveryId: delivery.id,
          webhookId: delivery.webhook.id,
          attempts: delivery.attempts,
          result,
          now: new Date(),
        });
      }),
    );
    for (const outcome of outcomes) {
      if (outcome === "disabled") {
        summary.exhausted++;
      }
      summary[outcome]++;
    }
  }

  return summary;
}
