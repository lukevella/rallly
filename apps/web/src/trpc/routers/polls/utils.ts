import { TRPCError } from "@trpc/server";
import {
  getParticipant,
  hasPollAdminAccess,
  listParticipantIdsByToken,
} from "@/features/poll/data";

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
export async function authorizeParticipantEdit({
  participantId,
  token,
  ctxUser,
}: {
  participantId: string;
  token: string | undefined;
  ctxUser: Actor | undefined;
}) {
  const participant = await getParticipant({ participantId });

  if (!participant) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Participant not found",
    });
  }

  if (participant.poll.deleted) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Participant not found",
    });
  }

  if (participant.poll.status !== "open") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This poll is no longer accepting changes",
    });
  }

  const ownedBySession = ctxUser
    ? participant.userId === ctxUser.id ||
      (await hasPollAdminAccess(participant.pollId, ctxUser.id))
    : false;

  const ownedByLink =
    !ownedBySession && token
      ? (
          await listParticipantIdsByToken({ pollId: participant.pollId, token })
        ).includes(participant.id)
      : false;

  if (!ownedBySession && !ownedByLink) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not allowed to modify this participant",
    });
  }

  const actor: Actor | null =
    ctxUser ??
    (participant.userId ? { id: participant.userId, isGuest: true } : null);

  return { participant, actor };
}
