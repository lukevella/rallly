"use server";

import { sendExistingResponseEmail } from "@rallly/emails/templates/existing-response";
import { sendNewParticipantEmail } from "@rallly/emails/templates/new-participant";
import { sendNewParticipantConfirmationEmail } from "@rallly/emails/templates/new-participant-confirmation";
import { createLogger } from "@rallly/logger";
import { absoluteUrl, shortUrl } from "@rallly/utils/absolute-url";
import { Effect } from "effect";
import { cookies } from "next/headers";
import { after } from "next/server";
import { getInstanceBranding, getSpaceBranding } from "@/emails/branding";
import { env } from "@/env";
import { resolveSpaceTier } from "@/features/billing/utils";
import { chargeEmailBudget } from "@/features/email-budget/mutations";
import { EmailBudgetStore } from "@/features/email-budget/service";
import type { EmailBudgetKind } from "@/features/email-budget/types";
import { getNotificationRecipient } from "@/features/notifications/data";
import { createUnsubscribeToken } from "@/features/notifications/utils";
import {
  getParticipant,
  hasPollAdminAccess,
  listParticipantIdsByTokens,
} from "@/features/poll/data";
import { getPollInvitePath } from "@/features/poll/invite/utils";
import type { ResponsePoll } from "@/features/poll/participant/mutations";
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
import {
  addVoterToken,
  getVoterCookie,
  parseVoterTokens,
} from "@/features/poll/participant/utils";
import { getLocale } from "@/i18n/server/get-locale";
import { runtime } from "@/lib/effect/runtime";
import { AppError } from "@/lib/errors/app-error";
import { flushPostHog, track, trackSystemEvent } from "@/lib/posthog";
import { createRateLimitGuard, createRatelimit } from "@/lib/rate-limit";
import {
  createRateLimitMiddleware,
  optionalUserActionClient,
} from "@/lib/safe-action/server";

const logger = createLogger("participants");

// A response needs no session, so the limits key on the client address and
// the poll. A per-user limit would also refuse a host entering responses for
// others. The IP limits are loose because offices, schools and mobile
// carriers put many people behind one address. The largest poll in 90 days
// took 295 responses in total, p99 is 23, so the per-poll cap and the cap on
// one address in one poll do not touch real use.
const pollResponseGuard = createRateLimitGuard(200, "1 h");
const ipPollResponseGuard = createRateLimitGuard(100, "1 h");
// Anyone can type an address, so the edit link of a response is sent again
// at most this often. Past it the submit still says to check the email.
const existingResponseLinkLimit = createRatelimit(3, "1 h");

type Actor = { id: string; isGuest: boolean };

async function readVoterTokens(pollId: string) {
  const cookieStore = await cookies();
  return parseVoterTokens(cookieStore.get(getVoterCookie(pollId).name)?.value);
}

// Server actions can write cookies, unlike a server component render. The
// page re-render in the same response already reads the new value.
async function rememberVoterToken(pollId: string, token: string) {
  const cookieStore = await cookies();
  const cookie = getVoterCookie(pollId);
  cookieStore.set(
    cookie.name,
    addVoterToken(cookieStore.get(cookie.name)?.value, token),
    cookie.options,
  );
}

// Analytics for a voter with no session goes under the response id, without
// a person profile, so the submit and later edits of one response join.
const toAnalyticsActor = (actor: Actor | null, participantId: string) =>
  actor ?? { id: participantId, isGuest: true };

/**
 * Proves the caller may edit a response. Two proofs are accepted: a token
 * that names the response itself, from the emailed link or from the cookie
 * this browser got when it submitted or opened the response, and a session
 * that owns the response or administers its poll. Admin access is bound to
 * the session only, so a link never unlocks other people's responses.
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

  const isOwnResponse = !!user && participant.userId === user.id;
  // Someone else's response edited through poll admin access. A host
  // editing their own response counts as a participant.
  const isHost =
    !!user &&
    !isOwnResponse &&
    (await hasPollAdminAccess(participant.pollId, user.id));
  const ownedBySession = isOwnResponse || isHost;

  let ownedByLink = false;
  if (!ownedBySession) {
    const voterTokens = await readVoterTokens(participant.pollId);
    const tokens = token ? [token, ...voterTokens] : voterTokens;
    ownedByLink =
      tokens.length > 0 &&
      (
        await listParticipantIdsByTokens({ pollId: participant.pollId, tokens })
      ).includes(participant.id);
  }

  if (!ownedBySession && !ownedByLink) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "You are not allowed to modify this participant",
    });
  }

  const actor: Actor | null =
    user ??
    (participant.userId ? { id: participant.userId, isGuest: true } : null);

  return {
    ok: true as const,
    participant,
    actor,
    actorRole: isHost ? ("host" as const) : ("participant" as const),
  };
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
  excludeUserId: string | undefined;
}) {
  try {
    const result = await getNotificationRecipient({
      pollId,
      type: "poll.response.submitted",
      excludeUserId,
    });

    if (!result.ok) {
      logger.info(
        { pollId, reason: result.reason },
        "Skipped new response notification email",
      );
      trackSystemEvent({
        event: "poll_notification:email_skip",
        properties: {
          poll_id: pollId,
          type: "poll.response.submitted",
          reason: result.reason,
        },
      });
      await flushPostHog();
      return;
    }

    const { recipient } = result;

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

/**
 * Charges one email to the poll owner: the address was typed by the
 * responder, so a host cannot use their poll to mail strangers.
 */
async function chargeResponseEmail(poll: ResponsePoll, kind: EmailBudgetKind) {
  const { allowed } = await runtime.runPromise(
    chargeEmailBudget({
      ownerId: poll.userId,
      tier: resolveSpaceTier(poll.space?.tier ?? "hobby"),
      pollId: poll.id,
      kind,
      recipients: 1,
    }).pipe(Effect.provide(EmailBudgetStore.layer)),
  );
  return allowed > 0;
}

async function getResponseEmailBranding(poll: ResponsePoll) {
  return poll.space
    ? await getSpaceBranding(poll.space)
    : await getInstanceBranding();
}

async function sendExistingResponseLink({
  email,
  locale,
  poll,
  token,
}: {
  email: string;
  locale: string;
  poll: ResponsePoll;
  token: string;
}) {
  const limited =
    existingResponseLinkLimit &&
    !(
      await existingResponseLinkLimit.limit(
        `existing_response_link:${poll.id}:${email.toLowerCase()}`,
      )
    ).success;

  const outcome = limited
    ? "rate_limited"
    : (await chargeResponseEmail(poll, "existing_response_link"))
      ? "sent"
      : "budget_exhausted";

  if (outcome === "sent") {
    await sendExistingResponseEmail({
      to: email,
      locale,
      branding: await getResponseEmailBranding(poll),
      props: {
        title: poll.title,
        editSubmissionUrl: shortUrl(
          getPollInvitePath({ pollId: poll.id, token }),
        ),
      },
    });
  }

  // A system event: the submit is not joined to the response it matched,
  // since the person who typed the address may not own it.
  trackSystemEvent({
    event: "poll_response:existing_email_submit",
    properties: {
      poll_id: poll.id,
      space_id: poll.space?.id,
      tier: poll.space?.tier,
      outcome,
    },
  });
  await flushPostHog();
}

export const addParticipantAction = optionalUserActionClient
  .metadata({ actionName: "add_participant" })
  .use(createRateLimitMiddleware({ requests: 60, duration: "1 m", by: "ip" }))
  .inputSchema(addParticipantSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { pollId, votes, name, email, note, timeZone, token } = parsedInput;

    ctx.event.pollId = pollId;
    await pollResponseGuard(`add_participant:poll:${pollId}`, ctx.event);
    if (ctx.event.ip) {
      await ipPollResponseGuard(
        `add_participant:ip_poll:${ctx.event.ip}:${pollId}`,
        ctx.event,
      );
    }
    const locale = await getLocale();

    const result = await addParticipant({
      pollId,
      actorUserId: ctx.user?.id,
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

    // Nothing was written, and the result is the same as for a new response
    // with an email, so a submit does not tell whether an address responded.
    if (!result.created) {
      const { poll, existingResponse } = result;
      if (existingResponse.email) {
        const existingEmail = existingResponse.email;
        after(() =>
          sendExistingResponseLink({
            email: existingEmail,
            locale,
            poll,
            token: existingResponse.token,
          }),
        );
      }
      return { ok: true as const, checkEmail: true as const };
    }

    const { participant, poll, editToken, viaInvite, totalResponses } = result;

    await rememberVoterToken(pollId, editToken);

    if (email) {
      after(async () => {
        if (!(await chargeResponseEmail(poll, "participant_confirmation"))) {
          return;
        }
        await sendNewParticipantConfirmationEmail({
          to: email,
          locale,
          branding: await getResponseEmailBranding(poll),
          props: {
            title: poll.title,
            editSubmissionUrl: shortUrl(
              getPollInvitePath({ pollId: poll.id, token: editToken }),
            ),
          },
        });
      });
    }

    after(() =>
      sendNewResponseNotificationEmail({
        pollId,
        pollTitle: poll.title,
        participantName: participant.name,
        participantEmail: participant.email,
        note: participant.note,
        excludeUserId: ctx.user?.id,
      }),
    );

    const voteCounts = votes.reduce(
      (acc, { type }) => {
        acc[type] += 1;
        return acc;
      },
      { yes: 0, ifNeedBe: 0, no: 0 },
    );

    track(toAnalyticsActor(ctx.user, participant.id), {
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

    return email
      ? { ok: true as const, checkEmail: true as const }
      : {
          ok: true as const,
          checkEmail: false as const,
          participant: { id: participant.id },
        };
  });

export const updateParticipantVotesAction = optionalUserActionClient
  .metadata({ actionName: "update_participant_votes" })
  .use(createRateLimitMiddleware({ requests: 60, duration: "1 m", by: "ip" }))
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

    if (result.ok) {
      track(toAnalyticsActor(actor, participantId), {
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

    return renameParticipant({
      participantId,
      pollId: participant.pollId,
      actorUserId: actor?.id,
      name,
    });
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

    const { participant, actor, actorRole } = authorization;

    const result = await deleteParticipant({
      participantId,
      pollId: participant.pollId,
      actorUserId: actor?.id,
    });

    if (result.ok) {
      track(toAnalyticsActor(actor, participantId), {
        event: "poll_response_delete",
        properties: { participant_id: participant.id, actor_role: actorRole },
        groups: { poll: participant.pollId },
      });
    }

    return result;
  });
