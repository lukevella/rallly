import "server-only";

import type { Prisma } from "@rallly/database";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { triggerHouseKeeping } from "@/lib/house-keeping/trigger";
import type { PollActivityEvent } from "./schema";
import { pollActivitySchema } from "./schema";

export type PollActivityWrite = { pollId: string } & PollActivityEvent;

/**
 * Appends activity events to a poll's log. Takes the caller's transaction
 * client because an event must commit atomically with the mutation it
 * records: activity cannot be backfilled, so a mutation committing without
 * its event is a permanent hole in the poll's history, and an event without
 * its mutation records something that never happened.
 *
 * The activity log is the webhook outbox, so a write also asks the
 * dispatcher to run for the poll's space once the response is sent, rather
 * than waiting for the next scheduled minute. The trigger fires after the
 * transaction commits; if the transaction rolls back the run finds nothing.
 * Only spaces with an enabled endpoint are asked, so the trigger costs
 * nothing everywhere else. The ask is an HTTP self-call because the
 * dispatcher lives in the webhook feature, which imports this one; calling
 * it here directly waits on the activity log becoming its own feature.
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

  if (!isFeatureEnabled("webhooks")) {
    return;
  }

  for (const pollId of new Set(activities.map((a) => a.pollId))) {
    const subscribed = await tx.spaceWebhook.count({
      where: { enabled: true, space: { polls: { some: { id: pollId } } } },
    });
    if (subscribed > 0) {
      triggerHouseKeeping("deliver-webhooks", { pollId });
    }
  }
}
