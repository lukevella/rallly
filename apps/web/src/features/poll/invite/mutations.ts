// apps/web/src/features/poll/invite/mutations.ts
import "server-only";

import { prisma } from "@rallly/database";
import { sendPollInviteEmail } from "@rallly/emails/templates/poll-invite";
import { createLogger } from "@rallly/logger";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { customAlphabet } from "nanoid";
import { getInstanceBranding, getSpaceBranding } from "@/emails/branding";
import { resolveSpaceTier } from "@/features/billing/utils";
import { recordPollActivities } from "@/features/poll/activity/mutations";
import { MAX_POLL_INVITES_PER_DAY } from "@/features/poll/invite/constants";

const logger = createLogger("poll/invite/mutations");

// Alphanumeric only: url safe with no linkifier edge cases. 32 chars is the
// floor documented on PollInvite.token.
const generateInviteToken = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  32,
);

export type SendPollInviteResult =
  | { ok: true; invite: { id: string; email: string } }
  | {
      ok: false;
      reason:
        | "notFound"
        | "pollClosed"
        | "paymentRequired"
        | "dailyLimit"
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
        id: true,
        title: true,
        status: true,
        space: {
          select: {
            tier: true,
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
      select: { name: true, locale: true },
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

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sentToday = await prisma.pollInvite.count({
    where: { poll: { userId }, createdAt: { gte: since } },
  });

  if (sentToday >= MAX_POLL_INVITES_PER_DAY) {
    return { ok: false, reason: "dailyLimit" };
  }

  // Participant.email is plain text, so the match is made insensitive here;
  // PollInvite.email is citext and its unique index handles it.
  const participant = await prisma.participant.findFirst({
    where: {
      pollId,
      deleted: false,
      email: { equals: email, mode: "insensitive" },
    },
    select: { id: true },
  });

  if (participant) {
    return { ok: false, reason: "alreadyResponded" };
  }

  const existing = await prisma.pollInvite.findUnique({
    where: { pollId_email: { pollId, email } },
    select: { id: true, revokedAt: true },
  });

  if (existing && existing.revokedAt === null) {
    return { ok: false, reason: "alreadyInvited" };
  }

  const token = generateInviteToken();

  const invite = await prisma.$transaction(async (tx) => {
    // A revoked row is reactivated with a fresh token so a leaked old link
    // never regains access.
    const row = existing
      ? await tx.pollInvite.update({
          where: { id: existing.id },
          data: { revokedAt: null, token },
          select: { id: true, email: true },
        })
      : await tx.pollInvite.create({
          data: { pollId, email, token },
          select: { id: true, email: true },
        });

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

  try {
    await sendPollInviteEmail({
      to: email,
      locale: sender.locale ?? "en",
      branding: poll.space
        ? await getSpaceBranding(poll.space)
        : await getInstanceBranding(),
      props: {
        hostName: sender.name,
        pollTitle: poll.title,
        inviteUrl: absoluteUrl(`/invite/${pollId}?invite=${token}`),
      },
    });
  } catch (error) {
    logger.error(
      { error, pollId, inviteId: invite.id },
      "Failed to send poll invite email",
    );
    // Undo the row and its activity so the list never shows an invite that
    // was never delivered. A reactivated row goes back to revoked.
    await prisma.$transaction(async (tx) => {
      await tx.pollActivity.deleteMany({
        where: { pollId, inviteId: invite.id, type: "invite_sent" },
      });
      if (existing) {
        await tx.pollInvite.update({
          where: { id: invite.id },
          data: { revokedAt: new Date() },
        });
      } else {
        await tx.pollInvite.delete({ where: { id: invite.id } });
      }
    });
    return { ok: false, reason: "sendFailed" };
  }

  return { ok: true, invite };
}

export async function revokePollInvite({
  pollId,
  inviteId,
  userId,
}: {
  pollId: string;
  inviteId: string;
  userId: string;
}) {
  return prisma.$transaction(async (tx) => {
    // Only pending invites revoke: a converted invite belongs to the
    // response now, and deleting the response is the way to undo that.
    const { count } = await tx.pollInvite.updateMany({
      where: { id: inviteId, pollId, revokedAt: null, participantId: null },
      data: { revokedAt: new Date() },
    });

    if (count === 0) {
      return { ok: false as const, reason: "notFound" as const };
    }

    const invite = await tx.pollInvite.findUniqueOrThrow({
      where: { id: inviteId },
      select: { email: true },
    });

    await recordPollActivities(tx, [
      {
        pollId,
        type: "invite_revoked",
        userId,
        inviteId,
        payload: { email: invite.email },
      },
    ]);

    return { ok: true as const };
  });
}
