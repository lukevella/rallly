import "server-only";

import { prisma } from "@rallly/database";
import type { SpaceTier } from "@/features/space/schema";
import type { AuthorizedSpaceId } from "@/features/space/types";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { WEBHOOK_ACTIVITY_TYPES } from "./utils";

export type WebhookAccess = "allowed" | "needs_upgrade" | "denied";

/**
 * Webhooks ride on the same capability as the rest of the developer surface:
 * a Pro capability of cloud hosted spaces, managed by the space owner.
 *
 * The three outcomes are distinguished because they need different
 * presentations: only a space whose *sole* missing condition is the tier can
 * fix this by paying, so only that case earns the upgrade screen. An
 * instance without the capability, or a member who could never manage
 * endpoints, must not be shown a pay wall for something buying Pro would not
 * give them.
 */
export function getWebhookAccess(
  user: { id: string },
  space: { tier: SpaceTier; ownerId: string },
): WebhookAccess {
  if (!isFeatureEnabled("webhooks") || space.ownerId !== user.id) {
    return "denied";
  }

  return space.tier === "pro" ? "allowed" : "needs_upgrade";
}

/**
 * A space's endpoints for the settings list. The last attempt's outcome comes
 * from the most recent delivery that was actually attempted, so an endpoint
 * with a queue of pending rows still shows the result the owner last saw.
 */
export async function getSpaceWebhooks({
  spaceId,
}: {
  spaceId: AuthorizedSpaceId;
}) {
  return prisma.spaceWebhook.findMany({
    where: { spaceId },
    select: {
      id: true,
      url: true,
      events: true,
      enabled: true,
      createdAt: true,
      deliveries: {
        where: { status: { in: ["succeeded", "failed", "exhausted"] } },
        select: {
          status: true,
          lastResponseStatus: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function countSpaceWebhooks({ spaceId }: { spaceId: string }) {
  return prisma.spaceWebhook.count({ where: { spaceId } });
}

/**
 * The reads below serve the dispatcher cron. Scope there is proven by the
 * webhook row itself — its spaceId was authorized when the endpoint was
 * created — not by a session, so they take plain ids.
 */

export async function listEnabledWebhooks({
  spaceId,
}: {
  spaceId?: string;
} = {}) {
  return prisma.spaceWebhook.findMany({
    where: { enabled: true, ...(spaceId ? { spaceId } : {}) },
    select: {
      id: true,
      spaceId: true,
      events: true,
      cursor: true,
      space: { select: { tier: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Webhook activities in a space's polls after the `(createdAt, id)` keyset
 * and up to `until`, oldest first. Keyset rather than offset so a run of
 * equal timestamps larger than one page still advances. Deleted polls are
 * not filtered out: `poll_deleted` is written in the same transaction as the
 * soft delete, and anything recorded just before it happened and is still
 * worth telling.
 */
export async function listWebhookActivities({
  spaceId,
  after,
  until,
  limit,
}: {
  spaceId: string;
  after: { createdAt: Date; id?: string };
  until: Date;
  limit: number;
}) {
  return prisma.pollActivity.findMany({
    where: {
      type: { in: WEBHOOK_ACTIVITY_TYPES },
      createdAt: { lte: until },
      OR: after.id
        ? [
            { createdAt: { gt: after.createdAt } },
            { createdAt: after.createdAt, id: { gt: after.id } },
          ]
        : [{ createdAt: { gt: after.createdAt } }],
      poll: { spaceId },
    },
    select: {
      id: true,
      type: true,
      participantId: true,
      optionId: true,
      payload: true,
      createdAt: true,
      poll: { select: { id: true, kind: true } },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: limit,
  });
}

/**
 * Deliveries due for an attempt on an enabled endpoint, oldest due first.
 * Candidates only: the caller claims each one and may lose the race to a
 * concurrent run.
 */
export async function listDueDeliveryIds({
  now,
  limit,
  spaceId,
}: {
  now: Date;
  limit: number;
  spaceId?: string;
}) {
  const rows = await prisma.webhookDelivery.findMany({
    where: {
      status: { in: ["pending", "failed"] },
      nextAttemptAt: { lte: now },
      webhook: { enabled: true, ...(spaceId ? { spaceId } : {}) },
    },
    select: { id: true },
    orderBy: { nextAttemptAt: "asc" },
    take: limit,
  });
  return rows.map((row) => row.id);
}

/** The space a poll belongs to, for scoping an immediate dispatcher run. */
export async function findPollSpaceId({ pollId }: { pollId: string }) {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    select: { spaceId: true },
  });
  return poll?.spaceId ?? null;
}
