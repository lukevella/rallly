"use server";

import { refresh } from "next/cache";

import { setPollMuted } from "@/features/poll/mutations";
import { setPollMutedSchema } from "@/features/poll/schema";
import { identifyGroup, track } from "@/lib/posthog";
import { authActionClient } from "@/lib/safe-action/server";

export const setPollMutedAction = authActionClient
  .metadata({ actionName: "set_poll_muted" })
  .inputSchema(setPollMutedSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { pollId, muted } = parsedInput;

    const result = await setPollMuted({
      pollId,
      userId: ctx.user.id,
      muted,
    });

    if (result.ok) {
      track(ctx.user, {
        event: "poll_notification:mute_update",
        properties: { poll_id: pollId, muted, source: "app" },
        groups: { poll: pollId },
      });
      identifyGroup({
        groupType: "poll",
        groupKey: pollId,
        properties: {
          muted,
        },
      });
    }

    refresh();

    return result;
  });
