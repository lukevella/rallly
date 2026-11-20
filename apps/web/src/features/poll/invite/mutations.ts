import "server-only";

import { Prisma, prisma } from "@rallly/database";
import { sendPollInviteEmail } from "@rallly/emails/templates/poll-invite";
import { createLogger } from "@rallly/logger";
import { shortUrl } from "@rallly/utils/absolute-url";
import { getInstanceBranding, getSpaceBranding } from "@/emails/branding";
import { recordPollActivities } from "@/features/activity/mutations";
import { startOfUtcMonth } from "@/features/api-keys/quota/utils";
import { resolveSpaceTier } from "@/features/billing/utils";
import {
  isEmailInviteQuotaEnabled,
  MAX_EMAIL_INVITES_PER_DAY,
} from "@/features/poll/invite/constants";
import {
  getMonthlyEmailInviteLimit,
  getPollInvitePath,
} from "@/features/poll/invite/utils";
import { generateAccessToken } from "@/features/poll/utils";

const logger = createLogger("poll/invite/mutations");

class InviteClaimedElsewhere extends Error {}
class MonthlyLimitReached extends Error {}

function toPeriodDate(period: Date) {
  return period.toISOString().slice(0, 10);
}

/**
 * Counts one invite against the space's month. With a limit, the increment
 * and the check are one statement, so concurrent sends can never exceed it.
 * Returns false when the limit is already reached.
 */
async function reserveEmailInviteSlot(
  tx: Prisma.TransactionClient,
  {
    spaceId,
    period,
    limit,
  }: { spaceId: string; period: Date; limit: number | null },
) {
  const rows = await tx.$queryRaw<{ count: number }[]>`
    INSERT INTO space_usage (space_id, resource, period, count, updated_at)
    VALUES (${spaceId}, 'email_invite', ${toPeriodDate(period)}::date, 1, NOW())
    ON CONFLICT (space_id, resource, period) DO UPDATE
    SET count = space_usage.count + 1, updated_at = NOW()
    WHERE ${limit}::int IS NULL OR space_usage.count < ${limit}::int
    RETURNING count
  `;
  return rows.length > 0;
}

/**
 * Gives back a slot for an invite that was never delivered, in the month it
 * was reserved in.
 */
async function releaseEmailInviteSlot(
  tx: Prisma.TransactionClient,
  { spaceId, period }: { spaceId: string; period: Date },
) {
  await tx.$executeRaw`
    UPDATE space_usage
    SET count = GREATEST(count - 1, 0), updated_at = NOW()
    WHERE space_id = ${spaceId}
      AND resource = 'email_invite'
      AND period = ${toPeriodDate(period)}::date
  `;
}

export type SendPollInviteResult =
  | { ok: true; invite: { id: string; email: string } }
  | {
      ok: false;
      reason:
        | "notFound"
        | "pollClosed"
        | "paymentRequired"
        | "dailyLimit"
        | "monthlyLimit"
        | "alreadyResponded"
        | "alreadyInvited"
        | "sendFailed";
    };

export async function sendPollInvite({
  pollId,
  userId,
  email,
}: {
  pollId: string;
  userId: string;
  email: string;
}): Promise<SendPollInviteResult> {
  const [poll, sender] = await Promise.all([
    prisma.poll.findFirst({
      where: { id: pollId, deleted: false },
      select: {
        title: true,
        status: true,
        spaceId: true,
        space: {
          select: {
            tier: true,
            subscriptions: {
              where: { active: true },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { quantity: true },
            },
            showBranding: true,
            hideAttribution: true,
            primaryColor: true,
            image: true,
          },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, locale: true },
    }),
  ]);

  if (!poll || !sender) {
    return { ok: false, reason: "notFound" };
  }

  if (poll.status !== "open") {
    return { ok: false, reason: "pollClosed" };
  }

  if (resolveSpaceTier(poll.space?.tier ?? "hobby") !== "pro") {
    return { ok: false, reason: "paymentRequired" };
  }

  // Counted against the sender, not the poll owner, so a co-member on a
  // shared space poll spends their own quota. The activity log records who
  // sent what; a failed send deletes its event, so it does not count.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sentToday = await prisma.pollActivity.count({
    where: { type: "invite_sent", userId, createdAt: { gte: since } },
  });

  if (sentToday >= MAX_EMAIL_INVITES_PER_DAY) {
    return { ok: false, reason: "dailyLimit" };
  }

  // Participant.email is plain text, so the match is made insensitive here;
  // PollInvite.email is citext and its unique index handles it.
  const participant = await prisma.participant.findFirst({
    where: {
      pollId,
      email: { equals: email, mode: "insensitive" },
    },
    select: { id: true },
  });

  if (participant) {
    return { ok: false, reason: "alreadyResponded" };
  }

  const existing = await prisma.pollInvite.findUnique({
    where: { pollId_email: { pollId, email } },
    select: { id: true, revokedAt: true, participantId: true },
  });

  // A converted invite belongs to the response now, regardless of
  // revokedAt: reactivating it here would clear revokedAt and rotate the
  // token on a row that still points at a participant.
  if (existing?.participantId) {
    return { ok: false, reason: "alreadyResponded" };
  }

  if (existing && existing.revokedAt === null) {
    return { ok: false, reason: "alreadyInvited" };
  }

  const token = generateAccessToken();

  // A reactivated invite keeps its id and gains a second invite_sent event,
  // so the rollback below must only touch events from this attempt.
  const attemptStartedAt = new Date();
  const period = startOfUtcMonth(attemptStartedAt);
  // Charged to the poll's space, pooled across its members. A poll without a
  // space has nothing to charge and, with billing on, cannot reach here.
  const spaceId = poll.spaceId;
  const monthlyLimit = getMonthlyEmailInviteLimit({
    enforced: isEmailInviteQuotaEnabled,
    seats: poll.space?.subscriptions[0]?.quantity ?? null,
  });

  let invite: { id: string; email: string };
  try {
    invite = await prisma.$transaction(async (tx) => {
      if (
        spaceId &&
        !(await reserveEmailInviteSlot(tx, {
          spaceId,
          period,
          limit: monthlyLimit,
        }))
      ) {
        throw new MonthlyLimitReached();
      }

      let row: { id: string; email: string };
      if (existing) {
        // A revoked row is reactivated with a fresh token so a leaked old
        // link never regains access. The claim only succeeds while the row
        // is still revoked, so two concurrent sends cannot both take it.
        const { count } = await tx.pollInvite.updateMany({
          where: { id: existing.id, revokedAt: { not: null } },
          data: { revokedAt: null, token },
        });
        if (count === 0) {
          throw new InviteClaimedElsewhere();
        }
        row = { id: existing.id, email };
      } else {
        row = await tx.pollInvite.create({
          data: { pollId, email, token },
          select: { id: true, email: true },
        });
      }

      await recordPollActivities(tx, [
        {
          pollId,
          type: "invite_sent",
          userId,
          inviteId: row.id,
          payload: { email: row.email },
        },
      ]);

      return row;
    });
  } catch (error) {
    if (error instanceof MonthlyLimitReached) {
      return { ok: false, reason: "monthlyLimit" };
    }
    // A concurrent send for the same poll/email either claimed the revoked
    // row first or raced the unique index on create.
    if (
      error instanceof InviteClaimedElsewhere ||
      (error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002")
    ) {
      return { ok: false, reason: "alreadyInvited" };
    }
    throw error;
  }

  try {
    await sendPollInviteEmail({
      to: email,
      // Sent on the host's behalf, so replies go to them rather than the
      // From address. Reply-To is outside DMARC alignment.
      replyTo: sender.email,
      locale: sender.locale ?? "en",
      branding: poll.space
        ? await getSpaceBranding(poll.space)
        : await getInstanceBranding(),
      props: {
        hostName: sender.name,
        pollTitle: poll.title,
        inviteUrl: shortUrl(getPollInvitePath({ pollId, token })),
      },
    });
  } catch (error) {
    logger.error(
      { error, pollId, inviteId: invite.id },
      "Failed to send poll invite email",
    );
    // Undo the row, its activity and its usage slot so the list never shows an invite that
    // was never delivered. A reactivated row goes back to revoked.
    try {
      await prisma.$transaction(async (tx) => {
        if (spaceId) {
          await releaseEmailInviteSlot(tx, { spaceId, period });
        }
        await tx.pollActivity.deleteMany({
          where: {
            pollId,
            inviteId: invite.id,
            type: "invite_sent",
            userId,
            createdAt: { gte: attemptStartedAt },
          },
        });
        // Matching the token as well as the id leaves a later send that
        // re-rotated the row alone.
        if (existing) {
          await tx.pollInvite.updateMany({
            where: { id: invite.id, token },
            data: { revokedAt: new Date() },
          });
        } else {
          await tx.pollInvite.deleteMany({ where: { id: invite.id, token } });
        }
      });
    } catch (rollbackError) {
      logger.error(
        { error: rollbackError, pollId, inviteId: invite.id },
        "Failed to roll back undelivered poll invite",
      );
    }
    return { ok: false, reason: "sendFailed" };
  }

  return { ok: true, invite };
}

/**
 * The pending invite behind an emailed link. Only the token counts as proof:
 * a typed address is unverified, so matching on it would let anyone claim
 * someone else's invite. Read inside the response's transaction so the
 * response can take the invite's token as its own. Two responses racing on
 * one link both find the row; the second fails on the participant token's
 * unique index rather than silently claiming a token already in use.
 */
export async function findPendingPollInvite(
  tx: Prisma.TransactionClient,
  { pollId, token }: { pollId: string; token: string },
) {
  return tx.pollInvite.findFirst({
    where: { pollId, token, participantId: null, revokedAt: null },
    select: { id: true, token: true },
  });
}

/**
 * Joins a new response to the invite it answers, so the host's list flips
 * from Sent to Responded. Runs inside the response's transaction so the join
 * commits with the participant.
 */
export async function attachParticipantToInvite(
  tx: Prisma.TransactionClient,
  { inviteId, participantId }: { inviteId: string; participantId: string },
) {
  await tx.pollInvite.update({
    where: { id: inviteId },
    data: { participantId },
    select: { id: true },
  });
}

/**
 * Marks an invite as opened the first time its emailed link is followed.
 * The token is the only credential, so an unknown, revoked or converted
 * token is a no-op rather than an error. First open wins: the claim on
 * `openedAt IS NULL` also serialises concurrent opens of the same link, so
 * the activity event is written exactly once.
 */
export async function recordPollInviteOpen({
  pollId,
  token,
}: {
  pollId: string;
  token: string;
}) {
  return prisma.$transaction(async (tx) => {
    const invite = await tx.pollInvite.findFirst({
      where: {
        pollId,
        token,
        revokedAt: null,
        participantId: null,
        openedAt: null,
      },
      select: { id: true, email: true },
    });

    if (!invite) {
      return false;
    }

    const { count } = await tx.pollInvite.updateMany({
      where: { id: invite.id, openedAt: null },
      data: { openedAt: new Date() },
    });

    if (count === 0) {
      return false;
    }

    await recordPollActivities(tx, [
      {
        pollId,
        type: "invite_opened",
        inviteId: invite.id,
        payload: { email: invite.email },
      },
    ]);

    return true;
  });
}

export type RevokePollInviteResult =
  | { ok: true }
  | { ok: false; reason: "notFound" | "alreadyResponded" };

/**
 * Removes a pending invite from the host's list. The row is kept and
 * stamped rather than deleted so its token stops resolving and a later
 * re-invite reactivates it with a fresh token. A converted invite belongs
 * to the response, so it is refused here; the host removes the response
 * instead. The claim on `revokedAt IS NULL` serialises concurrent removes
 * so the activity event is written once.
 */
export async function revokePollInvite({
  pollId,
  inviteId,
  userId,
}: {
  pollId: string;
  inviteId: string;
  userId: string;
}): Promise<RevokePollInviteResult> {
  return prisma.$transaction(async (tx) => {
    const invite = await tx.pollInvite.findFirst({
      where: { id: inviteId, pollId, revokedAt: null },
      select: { id: true, email: true, participantId: true },
    });

    if (!invite) {
      return { ok: false, reason: "notFound" };
    }

    if (invite.participantId) {
      return { ok: false, reason: "alreadyResponded" };
    }

    const { count } = await tx.pollInvite.updateMany({
      where: { id: invite.id, revokedAt: null, participantId: null },
      data: { revokedAt: new Date() },
    });

    if (count === 0) {
      return { ok: false, reason: "notFound" };
    }

    await recordPollActivities(tx, [
      {
        pollId,
        type: "invite_revoked",
        userId,
        inviteId: invite.id,
        payload: { email: invite.email },
      },
    ]);

    return { ok: true };
  });
}
