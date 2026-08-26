"use server";

import {
  closePoll,
  deletePoll,
  duplicatePoll,
  reopenPoll,
  setPollMuted,
} from "@/features/poll/mutations";
import {
  closePollSchema,
  deletePollSchema,
  duplicatePollSchema,
  reopenPollSchema,
  setPollMutedSchema,
} from "@/features/poll/schema";
import { getActiveSpaceForUser } from "@/features/space/data";
import { AppError } from "@/lib/errors/app-error";
import { identifyGroup, track } from "@/lib/posthog";
import { authActionClient } from "@/lib/safe-action/server";

async function requireActiveSpace(userId: string) {
  const space = await getActiveSpaceForUser(userId);

  if (!space) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "No active space found",
    });
  }

  return space;
}

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
      identifyGroup({
        groupType: "poll",
        groupKey: pollId,
        properties: {
          muted,
        },
      });
    }

    return result;
  });

export const closePollAction = authActionClient
  .metadata({ actionName: "close_poll" })
  .inputSchema(closePollSchema)
  .action(async ({ ctx, parsedInput }) => {
    const space = await requireActiveSpace(ctx.user.id);

    const poll = await closePoll({
      pollId: parsedInput.pollId,
      spaceId: space.id,
      userId: ctx.user.id,
    });

    if (!poll) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Poll not found",
      });
    }

    track(ctx.user, {
      event: "poll_close",
      groups: {
        poll: parsedInput.pollId,
      },
    });

    return { ok: true as const };
  });

export const reopenPollAction = authActionClient
  .metadata({ actionName: "reopen_poll" })
  .inputSchema(reopenPollSchema)
  .action(async ({ ctx, parsedInput }) => {
    const result = await reopenPoll({
      pollId: parsedInput.pollId,
      spaceId: (await requireActiveSpace(ctx.user.id)).id,
      userId: ctx.user.id,
    });

    if (result.ok) {
      track(ctx.user, {
        event: "poll_reopen",
        groups: {
          poll: parsedInput.pollId,
        },
      });
    }

    return result;
  });

export const deletePollAction = authActionClient
  .metadata({ actionName: "delete_poll" })
  .inputSchema(deletePollSchema)
  .action(async ({ ctx, parsedInput }) => {
    const space = await requireActiveSpace(ctx.user.id);

    const poll = await deletePoll(parsedInput.pollId, space.id);

    if (!poll) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Poll not found",
      });
    }

    track(ctx.user, {
      event: "poll_delete",
      groups: {
        poll: parsedInput.pollId,
      },
    });

    return { ok: true as const };
  });

export const duplicatePollAction = authActionClient
  .metadata({ actionName: "duplicate_poll" })
  .inputSchema(duplicatePollSchema)
  .action(async ({ ctx, parsedInput }) => {
    const space = await requireActiveSpace(ctx.user.id);

    if (space.tier !== "pro") {
      throw new AppError({
        code: "PAYMENT_REQUIRED",
        message: "Duplicating polls requires a Pro subscription",
      });
    }

    const poll = await duplicatePoll({
      pollId: parsedInput.pollId,
      spaceId: space.id,
      userId: ctx.user.id,
      title: parsedInput.title,
    });

    if (!poll) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Poll not found",
      });
    }

    track(ctx.user, {
      event: "poll_create",
      properties: {
        source: "duplicate",
      },
      groups: {
        poll: poll.id,
      },
    });

    return { id: poll.id };
  });
