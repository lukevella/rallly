"use server";

import { sendNewParticipantEmail } from "@rallly/emails/templates/new-participant";
import { sendNewParticipantConfirmationEmail } from "@rallly/emails/templates/new-participant-confirmation";
import { createLogger } from "@rallly/logger";
import { absoluteUrl, shortUrl } from "@rallly/utils/absolute-url";
import { after } from "next/server";
import { getInstanceBranding, getSpaceBranding } from "@/emails/branding";
import { env } from "@/env";
import { getNotificationRecipient } from "@/features/notifications/data";
import { createUnsubscribeToken } from "@/features/notifications/utils";
import {
  getParticipant,
  hasPollAdminAccess,
  listParticipantIdsByToken,
} from "@/features/poll/data";
import { getPollInvitePath } from "@/features/poll/invite/utils";
import {
  addParticipant,
  deleteParticipant,
  renameParticipant,
  updateParticipantVotes,
} from "@/features/poll/participant/mutations";
import {
  addParticipantSchema,
  deleteParticipantSchema,
  renameParticipantSchema,
  updateParticipantVotesSchema,
} from "@/features/poll/participant/schema";
import { getLocale } from "@/i18n/server/get-locale";
import { AppError } from "@/lib/errors/app-error";
import { track } from "@/lib/posthog";
import {
  anyUserActionClient,
  createRateLimitMiddleware,
  optionalUserActionClient,
} from "@/lib/safe-action/server";

const logger = createLogger("participants");

type Actor = { id: string; isGuest: boolean };

/**
 * Proves the caller may edit a response. Two proofs are accepted: the token
 * from the emailed link, which names the response itself, and a session that
 * owns the response or administers its poll. Admin access is bound to the
 * session only, so a link never unlocks other people's responses.
 *
 * A poll that is no longer open accepts no edits from anyone, admins
 * included — the same rule `canEditParticipant` applies in the client. The
 * lifecycle check comes first: whether the voting window has closed does not
 * depend on who is asking.
 *
 * The returned actor is for attribution (activity log, analytics): the
 * session when there is one, otherwise the user the response was created
 * under, who was a guest at the time.
 */
async function authorizeParticipantEdit({
  participantId,
  token,
  user,
}: {
  participantId: string;
  token: string | undefined;
  user: Actor | null;
}) {
  const participant = await getParticipant({ participantId });

  if (!participant || participant.poll.deleted) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "Participant not found",
    });
  }

  if (participant.poll.status !== "open") {
    return { ok: false as const, reason: "closed" as const };
  }

  const ownedBySession = user
    ? participant.userId === user.id ||
      (await hasPollAdminAccess(participant.pollId, user.id))
    : false;

  const ownedByLink =
    !ownedBySession && token
      ? (
          await listParticipantIdsByToken({ pollId: participant.pollId, token })
        ).includes(participant.id)
      : false;

  if (!ownedBySession && !ownedByLink) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "You are not allowed to modify this participant",
    });
  }

  const actor: Actor | null =
    user ??
    (participant.userId ? { id: participant.userId, isGuest: true } : null);

  return { ok: true as const, participant, actor };
}

async function sendNewResponseNotificationEmail({
  pollId,
  pollTitle,
  participantName,
  participantEmail,
  note,
  excludeUserId,
}: {
  pollId: string;
  pollTitle: string;
  participantName: string;
  participantEmail: string | null;
  note: string | null;
  excludeUserId: string;
}) {
  try {
    const recipient = await getNotificationRecipient({
      pollId,
      type: "poll.response.submitted",
      excludeUserId,
    });

    if (!recipient) {
      return;
    }

    const unsubscribeToken = createUnsubscribeToken({
      target: { kind: "poll", pollId, userId: recipient.id },
      secret: env.SECRET_PASSWORD,
    });

    await sendNewParticipantEmail({
      to: recipient.email,
      locale: recipient.locale ?? undefined,
      branding: await getInstanceBranding(),
      replyTo: participantEmail ?? undefined,
      listUnsubscribeUrl: absoluteUrl(`/api/unsubscribe/${unsubscribeToken}`),
      props: {
        participantName,
        note: note ?? undefined,
        canReply: !!participantEmail,
        pollUrl: absoluteUrl(`/poll/${pollId}`),
        unsubscribeUrl: absoluteUrl(`/unsubscribe/${unsubscribeToken}`),
        disableNotificationsUrl: absoluteUrl("/settings/notifications"),
        title: pollTitle,
      },
    });
  } catch (err) {
    logger.error(
      { error: err, pollId },
      "Failed to send new response notification email",
    );
  }
}

export const addParticipantAction = anyUserActionClient
  .metadata({ actionName: "add_participant" })
  .use(createRateLimitMiddleware(10, "1 h"))
  .inputSchema(addParticipantSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { pollId, votes, name, email, note, timeZone, token } = parsedInput;
    const locale = await getLocale();

    const result = await addParticipant({
      pollId,
      userId: ctx.user.id,
      locale,
      name,
      email,
      note,
      timeZone,
      token,
      votes,
    });

    if (!result.ok) {
      return result;
    }

    const { participant, poll, editToken, viaInvite, totalResponses } = result;

    if (email) {
      after(async () =>
        sendNewParticipantConfirmationEmail({
          to: email,
          locale,
          branding: poll.space
            ? await getSpaceBranding(poll.space)
            : await getInstanceBranding(),
          props: {
            title: poll.title,
            editSubmissionUrl: shortUrl(
              getPollInvitePath({ pollId: poll.id, token: editToken }),
            ),
          },
        }),
      );
    }

    after(() =>
      sendNewResponseNotificationEmail({
        pollId,
        pollTitle: poll.title,
        participantName: participant.name,
        participantEmail: participant.email,
        note: participant.note,
        excludeUserId: ctx.user.id,
      }),
    );

    const voteCounts = votes.reduce(
      (acc, { type }) => {
        acc[type] += 1;
        return acc;
      },
      { yes: 0, ifNeedBe: 0, no: 0 },
    );

    track(ctx.user, {
      event: "poll_response_submit",
      properties: {
        participant_id: participant.id,
        // plain properties, not groups: guest events are personless and
        // PostHog drops group associations without person processing
        poll_id: pollId,
        space_id: poll.space?.id,
        tier: poll.space?.tier,
        has_email: !!email,
        via_invite: viaInvite,
        has_note: !!participant.note,
        note_length: participant.note?.length,
        total_responses: totalResponses,
        // Whether the tentative option is offered at all, so the counts
        // below can be read against the polls that actually had it.
        allow_tentative_votes: poll.allowTentativeVotes,
        yes_count: voteCounts.yes,
        if_need_be_count: voteCounts.ifNeedBe,
        no_count: voteCounts.no,
      },
      groups: { poll: pollId },
    });

    return { ok: true as const, participant: { id: participant.id } };
  });

export const updateParticipantVotesAction = optionalUserActionClient
  .metadata({ actionName: "update_participant_votes" })
  .inputSchema(updateParticipantVotesSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { participantId, votes, token } = parsedInput;

    const authorization = await authorizeParticipantEdit({
      participantId,
      token,
      user: ctx.user,
    });

    if (!authorization.ok) {
      return authorization;
    }

    const { participant, actor } = authorization;

    const result = await updateParticipantVotes({
      participantId,
      pollId: participant.pollId,
      actorUserId: actor?.id,
      votes,
    });

    if (result.ok && actor) {
      track(actor, {
        event: "poll_response_update",
        groups: { poll: participant.pollId },
      });
    }

    return result;
  });

export const renameParticipantAction = optionalUserActionClient
  .metadata({ actionName: "rename_participant" })
  .inputSchema(renameParticipantSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { participantId, name, token } = parsedInput;

    const authorization = await authorizeParticipantEdit({
      participantId,
      token,
      user: ctx.user,
    });

    if (!authorization.ok) {
      return authorization;
    }

    const { participant, actor } = authorization;

    await renameParticipant({
      participantId,
      pollId: participant.pollId,
      actorUserId: actor?.id,
      name,
    });

    return { ok: true as const };
  });

export const deleteParticipantAction = optionalUserActionClient
  .metadata({ actionName: "delete_participant" })
  .inputSchema(deleteParticipantSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { participantId, token } = parsedInput;

    const authorization = await authorizeParticipantEdit({
      participantId,
      token,
      user: ctx.user,
    });

    if (!authorization.ok) {
      return authorization;
    }

    const { participant, actor } = authorization;

    await deleteParticipant({
      participantId,
      pollId: participant.pollId,
      actorUserId: actor?.id,
    });

    if (actor) {
      track(actor, {
        event: "poll_response_delete",
        properties: { participant_id: participant.id },
        groups: { poll: participant.pollId },
      });
    }

    return { ok: true as const };
  });
