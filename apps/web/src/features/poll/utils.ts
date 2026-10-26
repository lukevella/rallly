import { customAlphabet } from "nanoid";
import type { PollConferencing } from "@/features/conferencing/schema";
import { isProConferencingProvider } from "@/features/conferencing/utils";
import type { VoteType } from "@/features/poll/constants";
import type { PollComment, PollParticipant } from "@/features/poll/types";
import type { SpaceTier } from "@/features/space/schema";
import { getCalendarDate, toISODate } from "@/lib/datetime/utils";

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

export type OptionVotes = {
  yes: string[];
  ifNeedBe: string[];
  no: string[];
};

/**
 * Options in the order a host picks from: most available first, with a
 * firm yes outranking an ifNeedBe at the same total. Ties keep option order.
 */
export function rankOptionsByPopularity<T extends { id: string }>({
  options,
  participants,
}: {
  options: T[];
  participants: { id: string; votes: { optionId: string; type: VoteType }[] }[];
}): (T & { votes: OptionVotes })[] {
  const votesByOptionId = new Map<string, OptionVotes>(
    options.map((option) => [option.id, { yes: [], ifNeedBe: [], no: [] }]),
  );
  for (const participant of participants) {
    for (const vote of participant.votes) {
      votesByOptionId.get(vote.optionId)?.[vote.type].push(participant.id);
    }
  }
  return options
    .map((option) => ({
      ...option,
      votes: votesByOptionId.get(option.id) ?? {
        yes: [],
        ifNeedBe: [],
        no: [],
      },
    }))
    .sort((a, b) => comparePopularity(a.votes, b.votes));
}

function comparePopularity(a: OptionVotes, b: OptionVotes) {
  const score = (votes: OptionVotes) => [
    votes.yes.length + votes.ifNeedBe.length,
    votes.yes.length,
    votes.ifNeedBe.length,
  ];
  const sa = score(a);
  const sb = score(b);
  for (let i = 0; i < sa.length; i++) {
    if (sa[i] !== sb[i]) return sb[i] - sa[i];
  }
  return 0;
}

/**
 * Where the chosen option stood in the finalize list. Tied options share a
 * rank, so picking one of several joint winners reads as rank 1, tied.
 */
export function getChosenOptionRank({
  options,
  participants,
  optionId,
}: {
  options: { id: string }[];
  participants: { id: string; votes: { optionId: string; type: VoteType }[] }[];
  optionId: string;
}) {
  const ranked = rankOptionsByPopularity({ options, participants });
  const chosen = ranked.find((option) => option.id === optionId);
  if (!chosen) {
    return {
      chosen_rank: null,
      chosen_tied: false,
      option_count: ranked.length,
    };
  }
  let better = 0;
  let tied = 0;
  for (const option of ranked) {
    if (option.id === optionId) continue;
    const order = comparePopularity(option.votes, chosen.votes);
    if (order < 0) better++;
    if (order === 0) tied++;
  }
  return {
    chosen_rank: better + 1,
    chosen_tied: tied > 0,
    option_count: ranked.length,
  };
}

const HOUR_MS = 3_600_000;
// Floating times are stored as wall clock in UTC; the viewer's zone can be
// up to 14 hours either side.
const FLOATING_SLACK_MS = 14 * HOUR_MS;

/**
 * How far ahead of finalize the event starts. A floating time (all day, or a
 * poll without a zone) only counts as past once it is past in every zone.
 */
export function getFinalizeTiming({
  start,
  end,
  allDay,
  timeZone,
  now,
}: {
  start: Date;
  end: Date;
  allDay: boolean;
  timeZone: string | null;
  now: Date;
}) {
  const floating = allDay || !timeZone;
  const pastAfter = allDay
    ? end.getTime() + FLOATING_SLACK_MS
    : start.getTime() + (floating ? FLOATING_SLACK_MS : 0);
  return {
    hours_to_start: Math.round((start.getTime() - now.getTime()) / HOUR_MS),
    is_past: now.getTime() > pastAfter,
    floating_time: floating,
  };
}

const notifyBuckets = {
  yes: "yes",
  ifNeedBe: "if_need_be",
  no: "no",
} as const;

type NotifyBucket =
  | (typeof notifyBuckets)[keyof typeof notifyBuckets]
  | "no_response";

export type NotifySelectionSummary = Record<
  `notify_eligible_${NotifyBucket}` | `notify_selected_${NotifyBucket}`,
  number
> & { notify_selection_changed: boolean };

/**
 * Who a host could have notified at finalize and who they selected, by vote
 * on the chosen option, so the default selection can be judged from data.
 * Only participants with an email can be notified. This measures the host's
 * choice per participant, not delivery: participants sharing an address get
 * one email, but each is counted under their own vote.
 */
export function summarizeNotifySelection({
  participants,
  optionId,
  notifyParticipantIds,
}: {
  participants: {
    id: string;
    email: string | null;
    votes: { optionId: string; type: VoteType }[];
  }[];
  optionId: string;
  notifyParticipantIds: string[];
}): NotifySelectionSummary {
  const notifyIds = new Set(notifyParticipantIds);
  const summary: NotifySelectionSummary = {
    notify_eligible_yes: 0,
    notify_eligible_if_need_be: 0,
    notify_eligible_no: 0,
    notify_eligible_no_response: 0,
    notify_selected_yes: 0,
    notify_selected_if_need_be: 0,
    notify_selected_no: 0,
    notify_selected_no_response: 0,
    notify_selection_changed: false,
  };
  let eligible = 0;
  let selected = 0;
  for (const participant of participants) {
    if (!participant.email) continue;
    const vote = participant.votes.find((v) => v.optionId === optionId)?.type;
    const bucket: NotifyBucket = vote ? notifyBuckets[vote] : "no_response";
    summary[`notify_eligible_${bucket}`]++;
    eligible++;
    if (notifyIds.has(participant.id)) {
      summary[`notify_selected_${bucket}`]++;
      selected++;
    }
  }
  // The dialog starts with everyone who has an email selected.
  summary.notify_selection_changed = selected !== eligible;
  return summary;
}

export type FinalizePlanGate = "conferencing";

/**
 * Finalizing and notifying participants are free. What a free space cannot
 * do at finalize is mint a meeting with a Pro provider.
 */
export function getFinalizePlanGate({
  tier,
  conferencing,
}: {
  tier: SpaceTier;
  conferencing: { provider: PollConferencing["provider"] } | null;
}): FinalizePlanGate | null {
  if (tier === "pro") return null;
  if (
    conferencing &&
    conferencing.provider !== "custom" &&
    isProConferencingProvider(conferencing.provider)
  ) {
    return "conferencing";
  }
  return null;
}

// An all-day date is stored as UTC midnight, but it is still that date
// somewhere on Earth until UTC-12 reaches the next midnight: 24h + 12h.
const ALL_DAY_GRACE_MS = 36 * 60 * 60_000;

/**
 * Whether an option has already been and gone, by the server's clock.
 *
 * A time slot is past once it has ended. An all-day date has no zone, so the
 * server cannot know the voter's calendar; it counts as past only once that
 * date is over everywhere. The client's `isOptionPastForViewer` uses the
 * viewer's zone and so may lock a date a little earlier than this rejects it.
 */
export function isOptionPast(
  option: { startTime: Date; duration: number },
  now: Date,
) {
  const end =
    option.duration > 0
      ? option.startTime.getTime() + option.duration * 60_000
      : option.startTime.getTime() + ALL_DAY_GRACE_MS;
  return end < now.getTime();
}

/**
 * Whether an option has already been and gone, from the viewer's clock.
 *
 * A time slot is past once it has ended. An all-day date is a floating
 * calendar date stored as UTC midnight (RFC 5545), so it is past only once
 * the viewer's own calendar date has moved on — comparing its instant to
 * now would retire today's date for everyone west of UTC. Never later than
 * `isOptionPast`, so the client locks a date before the server refuses it.
 */
export function isOptionPastForViewer(
  option: { startTime: Date; duration: number },
  now: Date,
  timeZone: string,
) {
  if (option.duration > 0) {
    return (
      new Date(option.startTime).getTime() + option.duration * 60_000 <
      now.getTime()
    );
  }
  return toISODate(option.startTime) < getCalendarDate(now, timeZone);
}
