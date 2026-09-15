import "server-only";

import { prisma } from "@rallly/database";
import { WEBHOOK_ACTIVITY_TYPES } from "./utils";

/**
 * System-context reads for the dispatcher cron. Scope here is proven by the
 * webhook row itself — its spaceId was authorized when the endpoint was
 * created — not by a session, so these take plain ids.
 */

export async function listEnabledWebhooks() {
  return prisma.spaceWebhook.findMany({
    where: { enabled: true },
    select: { id: true, spaceId: true, events: true, cursor: true },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Status transition activities in a space's polls created after `after` and
 * up to `until`, oldest first. Deleted polls are excluded: their links no
 * longer resolve and the poll is on its way out.
 */
export async function listWebhookActivities({
  spaceId,
  after,
  until,
  limit,
}: {
  spaceId: string;
  after: Date;
  until: Date;
  limit: number;
}) {
  return prisma.pollActivity.findMany({
    where: {
      type: { in: WEBHOOK_ACTIVITY_TYPES },
      createdAt: { gt: after, lte: until },
      poll: { spaceId, deleted: false },
    },
    select: {
      id: true,
      type: true,
      optionId: true,
      payload: true,
      createdAt: true,
      poll: { select: { id: true, title: true, kind: true, timeZone: true } },
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
}: {
  now: Date;
  limit: number;
}) {
  const rows = await prisma.webhookDelivery.findMany({
    where: {
      status: { in: ["pending", "failed"] },
      nextAttemptAt: { lte: now },
      webhook: { enabled: true },
    },
    select: { id: true },
    orderBy: { nextAttemptAt: "asc" },
    take: limit,
  });
  return rows.map((row) => row.id);
}
