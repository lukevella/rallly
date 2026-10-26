"use server";

import { refresh } from "next/cache";

import {
  setParticipantsRevealed,
  setPollMuted,
} from "@/features/poll/mutations";
import {
  setParticipantsRevealedSchema,
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

export const setParticipantsRevealedAction = authActionClient
  .metadata({ actionName: "set_participants_revealed" })
  .inputSchema(setParticipantsRevealedSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { pollId, participantsRevealed } = parsedInput;

    const result = await setParticipantsRevealed({
      pollId,
      userId: ctx.user.id,
      participantsRevealed,
    });

    if (result.ok) {
      track(ctx.user, {
        event: "poll_participants:revealed_update",
        properties: {
          poll_id: pollId,
          participants_revealed: participantsRevealed,
        },
        groups: { poll: pollId },
      });
    }

    refresh();

    return result;
  });
