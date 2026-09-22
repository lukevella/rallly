import { customAlphabet } from "nanoid";
import type { VoteType } from "@/features/poll/constants";
import type { PollComment, PollParticipant } from "@/features/poll/types";

// Alphanumeric only: url safe with no linkifier edge cases. 32 chars is the
// floor documented on Participant.token and PollInvite.token.
export const generateAccessToken = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  32,
);

/**
 * Confirmation emails sent before responses carried their own token linked
 * to an iron-session seal of the guest's user id. Seals are self describing,
 * so the branch is picked by prefix without a failed lookup.
 */
export function isLegacyEditToken(token: string) {
  return token.startsWith("Fe26.2*");
}

export function filterParticipantsByVote<
  T extends { votes: { optionId: string; type: VoteType }[] },
>(participants: T[], optionId: string, voteType: VoteType): T[] {
  return participants.filter((participant) => {
    return participant.votes.some((vote) => {
      return vote.optionId === optionId && vote.type === voteType;
    });
  });
}

type RawParticipant = Omit<PollParticipant, "hidden" | "editUrl"> & {
  token: string;
};

/**
 * Scopes the response list to a viewer who is not the host. Notes are for
 * the host and their author only, so they survive only on the viewer's own
 * responses: the ones their session created, or the one the emailed link
 * they opened names. With hidden participants, everyone else's identity is
 * withheld while their votes still count.
 */
export function maskParticipantsForViewer({
  participants,
  viewer,
  hideParticipants,
}: {
  participants: RawParticipant[];
  viewer: { userId: string | null; linkedParticipantIds: string[] };
  hideParticipants: boolean;
}): PollParticipant[] {
  const linkedIds = new Set(viewer.linkedParticipantIds);
  const isOwn = (participant: { id: string; userId: string | null }) =>
    linkedIds.has(participant.id) ||
    (!!viewer.userId && participant.userId === viewer.userId);

  return participants.map(({ token: _token, ...participant }) => {
    if (isOwn(participant)) {
      return { ...participant, hidden: false, editUrl: null };
    }
    if (hideParticipants) {
      return {
        ...participant,
        userId: null,
        name: "",
        email: null,
        image: null,
        note: null,
        hidden: true,
        editUrl: null,
      };
    }
    return { ...participant, note: null, hidden: false, editUrl: null };
  });
}

/**
 * With hidden participants, a viewer who is not the host sees only their
 * own comments; the author names would otherwise reveal who responded.
 */
export function filterCommentsForViewer({
  comments,
  viewerUserId,
  hideParticipants,
}: {
  comments: PollComment[];
  viewerUserId: string | null;
  hideParticipants: boolean;
}): PollComment[] {
  if (!hideParticipants) {
    return comments;
  }
  if (!viewerUserId) {
    return [];
  }
  return comments.filter((comment) => comment.userId === viewerUserId);
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

export type AvailabilitySpan = {
  start: string;
  end: string;
  allDay: boolean;
  modifiers: string[];
};

/**
 * A participant's votes as availability: one span per option they can
 * make, in option order. A "no" is absence, as in a free/busy listing, and
 * "ifNeedBe" is a modifier on an available span. All-day options are stored
 * as UTC midnight with a zero duration, so they span their UTC day.
 */
export function toAvailabilitySpans({
  kind,
  votes,
}: {
  kind: "date" | "time";
  votes: {
    type: VoteType;
    option: { startTime: Date; duration: number };
  }[];
}): AvailabilitySpan[] {
  const allDay = kind === "date";
  return votes
    .filter((vote) => vote.type !== "no")
    .sort((a, b) => a.option.startTime.getTime() - b.option.startTime.getTime())
    .map(({ type, option }) => ({
      start: option.startTime.toISOString(),
      end: new Date(
        option.startTime.getTime() +
          (allDay ? DAY_MS : option.duration * MINUTE_MS),
      ).toISOString(),
      allDay,
      modifiers: type === "ifNeedBe" ? ["ifNeedBe"] : [],
    }));
}
