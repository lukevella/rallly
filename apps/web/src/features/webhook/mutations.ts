import "server-only";

import { randomBytes } from "node:crypto";
import { subject } from "@casl/ability";
import type { Prisma } from "@rallly/database";
import { prisma } from "@rallly/database";
import { decrypt, encrypt } from "@rallly/utils/encryption";
import { Clock, Data, Effect } from "effect";
import { env } from "@/env";
import { resolveSpaceTier } from "@/features/billing/utils";
import type { DatabaseError } from "@/lib/effect/db";
import { fromPrisma } from "@/lib/effect/db";
import { AppError } from "@/lib/errors/app-error";
import { defineAbilityForWebhooks } from "./ability";
import {
  DELIVERY_CLAIM_BATCH_SIZE,
  DELIVERY_CONCURRENCY,
  FAN_OUT_BATCH_SIZE,
  FAN_OUT_LAG_MS,
  FAN_OUT_OVERLAP_MS,
  IN_FLIGHT_TIMEOUT_MS,
  MAX_CONSECUTIVE_FAILURES,
  MAX_DELIVERY_ATTEMPTS,
  WEBHOOK_VERSION,
} from "./constants";
import {
  listDueDeliveryIds,
  listEnabledWebhooks,
  listWebhookActivities,
} from "./data";
import type { WebhookEventType } from "./schema";
import { MAX_WEBHOOKS_PER_SPACE } from "./schema";
import { WebhookSender } from "./service";
import {
  buildWebhookPayload,
  getRetryDelayMs,
  toWebhookEventType,
} from "./utils";

/** Limits a dispatcher run to one space's endpoints. */
export type DispatchScope = { spaceId: string };

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
 *
 * Webhooks are a Pro capability, checked here the way the API checks it on
 * every request: an endpoint whose space is no longer Pro fans out nothing,
 * and its cursor still advances so an upgrade resumes from then rather than
 * replaying the gap. As with re-enabling an endpoint, the overlap window
 * behind the cursor can still deliver events from the last few minutes.
 */
export const fanOutWebhookEvents = Effect.fn("webhook.fanOutWebhookEvents")(
  function* ({ now, scope }: { now: Date; scope?: DispatchScope }) {
    // A run triggered right after a write has nothing uncommitted to fear
    // from its own row, so it reads up to now; the overlap window still
    // covers any other row that commits late.
    const lag = scope ? 0 : FAN_OUT_LAG_MS;
    const until = new Date(now.getTime() - lag);
    let created = 0;

    for (const webhook of yield* fromPrisma(() =>
      listEnabledWebhooks({ spaceId: scope?.spaceId }),
    )) {
      if (webhook.cursor >= until) {
        continue;
      }

      if (resolveSpaceTier(webhook.space.tier) !== "pro") {
        yield* fromPrisma(() =>
          prisma.spaceWebhook.update({
            where: { id: webhook.id },
            data: { cursor: until },
          }),
        );
        continue;
      }

      let after: { createdAt: Date; id?: string } = {
        createdAt: new Date(webhook.cursor.getTime() - FAN_OUT_OVERLAP_MS),
      };

      for (;;) {
        const activities = yield* fromPrisma(() =>
          listWebhookActivities({
            spaceId: webhook.spaceId,
            after,
            until,
            limit: FAN_OUT_BATCH_SIZE,
          }),
        );

        const deliveries = activities.flatMap((activity) => {
          const eventType = toWebhookEventType(activity.type);
          if (!eventType || !webhook.events.includes(eventType)) {
            return [];
          }
          const payload = buildWebhookPayload({
            activity,
            poll: activity.poll,
          });
          return payload
            ? [
                {
                  webhookId: webhook.id,
                  activityId: activity.id,
                  eventType,
                  payload: payload as unknown as Prisma.InputJsonObject,
                  // The run's own clock, not the database default: the claim
                  // that follows in the same run compares against this
                  // instant.
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

        const [result] = yield* fromPrisma(() =>
          prisma.$transaction([
            prisma.webhookDelivery.createMany({
              data: deliveries,
              skipDuplicates: true,
            }),
            prisma.spaceWebhook.update({
              where: { id: webhook.id },
              data: { cursor },
            }),
          ]),
        );
        created += result.count;

        if (drained) {
          break;
        }
        after = { createdAt: last.createdAt, id: last.id };
      }
    }

    return created;
  },
);

/**
 * Returns in-flight deliveries abandoned by a run that died mid-send to the
 * queue. The attempt was already counted at claim time, so a delivery that
 * keeps dying still exhausts instead of looping forever.
 */
export const reclaimStaleDeliveries = Effect.fn(
  "webhook.reclaimStaleDeliveries",
)(function* ({ now }: { now: Date }) {
  const staleBefore = new Date(now.getTime() - IN_FLIGHT_TIMEOUT_MS);
  const [exhausted, reclaimed] = yield* fromPrisma(() =>
    prisma.$transaction([
      prisma.webhookDelivery.updateMany({
        where: {
          status: "in_flight",
          updatedAt: { lt: staleBefore },
          attempts: { gte: MAX_DELIVERY_ATTEMPTS },
        },
        data: {
          status: "exhausted",
          lastError: "Delivery run did not finish",
        },
      }),
      prisma.webhookDelivery.updateMany({
        where: { status: "in_flight", updatedAt: { lt: staleBefore } },
        data: { status: "pending" },
      }),
    ]),
  );
  return exhausted.count + reclaimed.count;
});

/**
 * Claims due deliveries for this run. Each claim is a conditional update on
 * one row, so two overlapping runs never send the same delivery: whichever
 * flips it to in_flight owns it. Counting the attempt here rather than on
 * completion means a run that dies after sending still used an attempt.
 */
export const claimDueDeliveries = Effect.fn("webhook.claimDueDeliveries")(
  function* ({
    now,
    limit,
    scope,
  }: {
    now: Date;
    limit: number;
    scope?: DispatchScope;
  }) {
    const claimed: string[] = [];
    for (const id of yield* fromPrisma(() =>
      listDueDeliveryIds({ now, limit, spaceId: scope?.spaceId }),
    )) {
      const { count } = yield* fromPrisma(() =>
        prisma.webhookDelivery.updateMany({
          where: {
            id,
            status: { in: ["pending", "failed"] },
            nextAttemptAt: { lte: now },
            // Re-checked here, not only when listing candidates: another run
            // may have disabled the endpoint in between.
            webhook: { enabled: true },
          },
          data: { status: "in_flight", attempts: { increment: 1 } },
        }),
      );
      if (count === 1) {
        claimed.push(id);
      }
    }

    return yield* fromPrisma(() =>
      prisma.webhookDelivery.findMany({
        where: { id: { in: claimed } },
        select: {
          id: true,
          eventType: true,
          payload: true,
          attempts: true,
          webhook: { select: { id: true, url: true, secret: true } },
        },
      }),
    );
  },
);

export type DeliveryOutcome = "succeeded" | "failed" | "exhausted" | "disabled";

/**
 * What one attempt came to. Persisted on the delivery row, so a failure is
 * data here, not an error: the send's typed error is folded into this shape
 * before anything is recorded.
 */
type DeliveryAttempt =
  | { ok: true; status: number }
  | { ok: false; status: number | null; error: string };

/**
 * Records an attempt's outcome on the delivery and its endpoint. A failure
 * with schedule left is re-queued with backoff; past the schedule it is
 * exhausted and counts against the endpoint, which is disabled once too
 * many exhaust in a row. Any success resets that count.
 */
export const recordDeliveryResult = Effect.fn("webhook.recordDeliveryResult")(
  function* ({
    deliveryId,
    webhookId,
    attempts,
    result,
    now,
  }: {
    deliveryId: string;
    webhookId: string;
    attempts: number;
    result: DeliveryAttempt;
    now: Date;
  }) {
    return yield* fromPrisma(() =>
      prisma.$transaction(async (tx): Promise<DeliveryOutcome> => {
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
      }),
    );
  },
);

class DecryptError extends Data.TaggedError("DecryptError") {}

/**
 * Every failure mode ends in a `DeliveryAttempt`: a delivery is already in
 * flight by now, and an error escaping here would leave it stranded until
 * stale reclamation. The trailing catch is what makes that a type, not a
 * convention: the error channel is `never`.
 */
export const attemptDelivery = Effect.fn("webhook.attemptDelivery")(
  function* (delivery: {
    id: string;
    eventType: string;
    payload: Prisma.JsonValue;
    webhook: { url: string; secret: string };
  }) {
    const secret = yield* Effect.try({
      try: () => decrypt(delivery.webhook.secret, env.SECRET_PASSWORD),
      catch: () => new DecryptError(),
    });
    // From the stored payload, not the current constant: the body is frozen
    // at fan-out, so the header has to describe the shape actually being
    // sent.
    const version =
      delivery.payload &&
      typeof delivery.payload === "object" &&
      !Array.isArray(delivery.payload) &&
      typeof delivery.payload.version === "string"
        ? delivery.payload.version
        : null;

    const sender = yield* WebhookSender;
    const { status } = yield* sender.send({
      url: delivery.webhook.url,
      secret,
      deliveryId: delivery.id,
      eventType: delivery.eventType as WebhookEventType,
      version,
      body: JSON.stringify(delivery.payload),
    });
    return { ok: true, status } satisfies DeliveryAttempt as DeliveryAttempt;
  },
  Effect.catchTags({
    DecryptError: () =>
      Effect.succeed<DeliveryAttempt>({
        ok: false,
        status: null,
        error: "Could not decrypt the endpoint secret",
      }),
    WebhookSendError: (error) =>
      Effect.succeed<DeliveryAttempt>({
        ok: false,
        status: error.status,
        error: error.message,
      }),
  }),
);

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
 *
 * The scheduled run takes no scope and covers everything. A run triggered
 * by a write is scoped to that write's space and reads without the fan-out
 * lag, so the event it was triggered for goes out at once; the scheduled
 * run remains the guarantee for anything it misses.
 */
export const deliverWebhooks = Effect.fn("webhook.deliverWebhooks")(function* ({
  now,
  scope,
}: {
  now: Date;
  scope?: DispatchScope;
}): Effect.fn.Return<DeliverWebhooksSummary, DatabaseError, WebhookSender> {
  const reclaimed = scope ? 0 : yield* reclaimStaleDeliveries({ now });
  const fannedOut = yield* fanOutWebhookEvents({ now, scope });
  const deliveries = yield* claimDueDeliveries({
    now,
    limit: DELIVERY_CLAIM_BATCH_SIZE,
    scope,
  });

  const outcomes = yield* Effect.forEach(
    deliveries,
    Effect.fn("webhook.deliverOne")(function* (delivery) {
      const result = yield* attemptDelivery(delivery);
      const recordedAt = new Date(yield* Clock.currentTimeMillis);
      return yield* recordDeliveryResult({
        deliveryId: delivery.id,
        webhookId: delivery.webhook.id,
        attempts: delivery.attempts,
        result,
        now: recordedAt,
      });
    }),
    { concurrency: DELIVERY_CONCURRENCY },
  );

  const summary: DeliverWebhooksSummary = {
    reclaimed,
    fannedOut,
    attempted: deliveries.length,
    succeeded: 0,
    failed: 0,
    exhausted: 0,
    disabled: 0,
  };
  for (const outcome of outcomes) {
    if (outcome === "disabled") {
      summary.exhausted++;
    }
    summary[outcome]++;
  }
  return summary;
});

/**
 * Endpoint management for the settings page. Scope is proven by the caller's
 * action gate: the spaceId passed here is the actor's own space, and CASL
 * re-checks the target row against it before any write.
 */

/**
 * Signing secret shown once at creation. 32 random bytes, prefixed so it is
 * recognisable in a receiver's config, and stored encrypted — the dispatcher
 * needs the plaintext to sign with, so this cannot be a one-way hash.
 */
function generateWebhookSecret() {
  return `whsec_${randomBytes(32).toString("base64url")}`;
}

export async function createWebhook({
  spaceId,
  url,
  events,
}: {
  spaceId: string;
  url: string;
  events: WebhookEventType[];
}) {
  const count = await prisma.spaceWebhook.count({ where: { spaceId } });

  // Expected outcome the caller handles specifically, so it's part of the
  // return value; thrown errors are reserved for the global error handler.
  if (count >= MAX_WEBHOOKS_PER_SPACE) {
    return { ok: false, reason: "max_webhooks_exceeded" } as const;
  }

  const secret = generateWebhookSecret();

  const webhook = await prisma.spaceWebhook.create({
    data: {
      spaceId,
      url,
      events,
      secret: encrypt(secret, env.SECRET_PASSWORD),
      // Recorded here, not by the DB default, so a version bump in the
      // constant is what new endpoints get.
      version: WEBHOOK_VERSION,
    },
    select: { id: true },
  });

  return { ok: true, webhookId: webhook.id, secret } as const;
}

async function authorizeWebhook({
  spaceId,
  webhookId,
  action,
}: {
  spaceId: string;
  webhookId: string;
  action: "update" | "delete";
}) {
  const webhook = await prisma.spaceWebhook.findUnique({
    where: { id: webhookId },
    select: { spaceId: true },
  });

  if (!webhook) {
    throw new AppError({ code: "NOT_FOUND", message: "Webhook not found" });
  }

  const ability = defineAbilityForWebhooks({ spaceId });

  if (ability.cannot(action, subject("Webhook", webhook))) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "You do not have permission to manage this webhook",
    });
  }
}

/**
 * Re-enabling clears the failure count and moves the cursor to now: an
 * endpoint is usually disabled after a long outage, and replaying everything
 * that happened while it was dark is not what the owner asked for.
 */
export async function setWebhookEnabled({
  spaceId,
  webhookId,
  enabled,
}: {
  spaceId: string;
  webhookId: string;
  enabled: boolean;
}) {
  await authorizeWebhook({ spaceId, webhookId, action: "update" });

  await prisma.spaceWebhook.update({
    where: { id: webhookId },
    data: enabled
      ? { enabled: true, consecutiveFailures: 0, cursor: new Date() }
      : { enabled: false },
  });
}

export async function deleteWebhook({
  spaceId,
  webhookId,
}: {
  spaceId: string;
  webhookId: string;
}) {
  await authorizeWebhook({ spaceId, webhookId, action: "delete" });

  // Deliveries cascade with the endpoint.
  await prisma.spaceWebhook.delete({ where: { id: webhookId } });
}
