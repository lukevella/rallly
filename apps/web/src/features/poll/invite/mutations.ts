import "server-only";

import { Prisma, prisma } from "@rallly/database";
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

  const token = generateInviteToken();

  let invite: { id: string; email: string };
  try {
    invite = await prisma.$transaction(async (tx) => {
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
  } catch (error) {
    // A concurrent send for the same poll/email raced the unique index.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, reason: "alreadyInvited" };
    }
    throw error;
  }

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
    try {
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
