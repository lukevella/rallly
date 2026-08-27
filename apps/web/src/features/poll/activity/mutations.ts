import "server-only";

import type { Prisma } from "@rallly/database";
import type { PollActivityEvent } from "./schema";
import { pollActivitySchema } from "./schema";

export type PollActivityWrite = { pollId: string } & PollActivityEvent;

/**
 * Appends activity events to a poll's log. Takes the caller's transaction
 * client because an event must commit atomically with the mutation it
 * records: activity cannot be backfilled, so a mutation committing without
 * its event is a permanent hole in the poll's history, and an event without
 * its mutation records something that never happened.
 */
export async function recordPollActivities(
  tx: Prisma.TransactionClient,
  activities: PollActivityWrite[],
) {
  if (activities.length === 0) {
    return;
  }

  await tx.pollActivity.createMany({
    data: activities.map(({ pollId, ...event }) => {
      const parsed = pollActivitySchema.parse(event);
      return {
        pollId,
        type: parsed.type,
        userId: ("userId" in parsed ? parsed.userId : null) ?? null,
        participantId: "participantId" in parsed ? parsed.participantId : null,
        inviteId: "inviteId" in parsed ? parsed.inviteId : null,
        optionId: "optionId" in parsed ? parsed.optionId : null,
        payload: parsed.payload as Prisma.InputJsonObject,
      };
    }),
  });
}
