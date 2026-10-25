"use server";

import { refresh } from "next/cache";

import { hasPollAdminAccess } from "@/features/poll/data";
import { setPollMuted, setPollReadyToDecide } from "@/features/poll/mutations";
import {
  setPollMutedSchema,
  setPollReadyToDecideSchema,
} from "@/features/poll/schema";
import { AppError } from "@/lib/errors/app-error";
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

export const setPollReadyToDecideAction = authActionClient
  .metadata({ actionName: "set_poll_ready_to_decide" })
  .inputSchema(setPollReadyToDecideSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { pollId, readyToDecide } = parsedInput;

    if (!(await hasPollAdminAccess(pollId, ctx.user.id))) {
      throw new AppError({ code: "NOT_FOUND", message: "Poll not found" });
    }

    const result = await setPollReadyToDecide({ pollId, readyToDecide });

    refresh();

    return result;
  });
