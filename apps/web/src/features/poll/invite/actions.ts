// apps/web/src/features/poll/invite/actions.ts
"use server";

import { hasPollAdminAccess } from "@/features/poll/data";
import {
  revokePollInvite,
  sendPollInvite,
} from "@/features/poll/invite/mutations";
import {
  revokePollInviteSchema,
  sendPollInviteSchema,
} from "@/features/poll/invite/schema";
import { AppError } from "@/lib/errors/app-error";
import { track } from "@/lib/posthog";
import {
  authActionClient,
  createRateLimitMiddleware,
} from "@/lib/safe-action/server";

export const sendPollInviteAction = authActionClient
  .metadata({ actionName: "send_poll_invite" })
  // One email per call; the daily recipient cap lives in the mutation.
  .use(createRateLimitMiddleware(30, "1 m"))
  .inputSchema(sendPollInviteSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { pollId, email } = parsedInput;

    if (!(await hasPollAdminAccess(pollId, ctx.user.id))) {
      throw new AppError({ code: "NOT_FOUND", message: "Poll not found" });
    }

    const result = await sendPollInvite({ pollId, userId: ctx.user.id, email });

    if (!result.ok && result.reason === "paymentRequired") {
      throw new AppError({
        code: "PAYMENT_REQUIRED",
        message: "Email invites require a Pro subscription",
      });
    }

    track(
      { id: ctx.user.id, isGuest: false },
      {
        event: "poll_share:invite_send",
        properties: {
          poll_id: pollId,
          ok: result.ok,
          reason: result.ok ? undefined : result.reason,
        },
        groups: { poll: pollId },
      },
    );

    return result;
  });

export const revokePollInviteAction = authActionClient
  .metadata({ actionName: "revoke_poll_invite" })
  .inputSchema(revokePollInviteSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { pollId, inviteId } = parsedInput;

    if (!(await hasPollAdminAccess(pollId, ctx.user.id))) {
      throw new AppError({ code: "NOT_FOUND", message: "Poll not found" });
    }

    const result = await revokePollInvite({
      pollId,
      inviteId,
      userId: ctx.user.id,
    });

    track(
      { id: ctx.user.id, isGuest: false },
      {
        event: "poll_share:invite_revoke",
        properties: { poll_id: pollId, ok: result.ok },
        groups: { poll: pollId },
      },
    );

    return result;
  });
