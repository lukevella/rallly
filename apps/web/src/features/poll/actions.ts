"use server";

import { refresh } from "next/cache";

import { hasPollAdminAccess } from "@/features/poll/data";
import { finalizeLocationPoll, setPollMuted } from "@/features/poll/mutations";
import {
  finalizeLocationPollSchema,
  setPollMutedSchema,
} from "@/features/poll/schema";
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

export const finalizeLocationPollAction = authActionClient
  .metadata({ actionName: "finalize_location_poll" })
  .inputSchema(finalizeLocationPollSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { pollId, optionId } = parsedInput;

    // Same rule as booking a date: only the poll's managers can finalize it.
    if (!(await hasPollAdminAccess(pollId, ctx.user.id))) {
      return { ok: false as const, reason: "forbidden" as const };
    }

    const result = await finalizeLocationPoll({
      pollId,
      optionId,
      userId: ctx.user.id,
    });

    if (result.ok) {
      track(ctx.user, {
        event: "poll_finalize:location_submit",
        properties: { poll_id: pollId },
        groups: { poll: pollId },
      });
    }

    refresh();

    return result;
  });
