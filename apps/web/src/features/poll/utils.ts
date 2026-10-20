import { customAlphabet } from "nanoid";
import type { VoteType } from "@/features/poll/constants";
import type {
  PollComment,
  PollDetails,
  PollParticipant,
} from "@/features/poll/types";
import type { SpaceTier } from "@/features/space/schema";
import {
  getCalendarDate,
  normalizeTimeZone,
  toISODate,
} from "@/lib/datetime/utils";
import { wallTimeToInstant } from "@/lib/datetime/wall-time";

/**
 * Generates a URL-safe alphanumeric token at the minimum length accepted by
 * `Participant.token` and `PollInvite.token`.
 */
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

/** Filters participants to those with the requested vote on an option. */
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
 * withheld while their votes still count. With aggregate results only,
 * everyone else's response is dropped: the viewer keeps their own answers
 * and reads the rest as totals.
 */
export function maskParticipantsForViewer({
  participants,
  viewer,
  hideParticipants,
  aggregateResultsOnly = false,
}: {
  participants: RawParticipant[];
  viewer: { userId: string | null; linkedParticipantIds: string[] };
  hideParticipants: boolean;
  aggregateResultsOnly?: boolean;
}): PollParticipant[] {
  const linkedIds = new Set(viewer.linkedParticipantIds);
  const isOwn = (participant: { id: string; userId: string | null }) =>
    linkedIds.has(participant.id) ||
    (!!viewer.userId && participant.userId === viewer.userId);

  return participants
    .filter((participant) => !aggregateResultsOnly || isOwn(participant))
    .map(({ token: _token, ...participant }) => {
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

/** Error message shared by poll creation guards across app and API routes. */
export const PAST_POLL_OPTIONS_MESSAGE = "Poll options must be in the future.";

/**
 * Whether an option has passed for a viewer.
 *
 * Timed options expire at their start instant; floating all-day options expire
 * only after the viewer's calendar date has advanced in their time zone.
 */
export function isPollOptionPast({
  option,
  now,
  timeZone,
}: {
  option: { startTime: Date; duration: number };
  now: Date;
  timeZone?: string | null;
}) {
  if (option.duration === 0) {
    const today = getCalendarDate(now, normalizeTimeZone(timeZone) ?? "UTC");
    return toISODate(option.startTime) < today;
  }

  return option.startTime.getTime() <= now.getTime();
}

/** Returns whether any option in a poll has passed for the given viewer. */
export function hasPastPollOptions({
  options,
  now,
  timeZone,
}: {
  options: { startTime: Date; duration: number }[];
  now: Date;
  timeZone?: string | null;
}) {
  return options.some((option) => isPollOptionPast({ option, now, timeZone }));
}

/**
 * Checks an option in its form representation, converting wall-clock times
 * with the selected zone and comparing date-only options as floating dates.
 */
export function isPollFormOptionPast({
  option,
  now,
  timeZone,
}: {
  option:
    | { type: "date"; date: string }
    | { type: "timeSlot"; start: string; end: string };
  now: Date;
  timeZone: string;
}) {
  if (option.type === "date") {
    return isPollOptionPast({
      option: {
        startTime: new Date(`${option.date}T00:00:00Z`),
        duration: 0,
      },
      now,
      timeZone,
    });
  }

  return wallTimeToInstant(option.start, timeZone).getTime() <= now.getTime();
}

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
 *
 * @param getScore - Totals per option that replace the participant count,
 * for an aggregate results poll whose host holds totals and no responses.
 */
export function rankOptionsByPopularity<T extends { id: string }>({
  options,
  participants,
  getScore,
}: {
  options: T[];
  participants: { id: string; votes: { optionId: string; type: VoteType }[] }[];
  getScore?: (optionId: string) => { yes: number; ifNeedBe: number };
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
    .sort((a, b) =>
      comparePopularity(scoreOf(a, getScore), scoreOf(b, getScore)),
    );
}

type PopularityScore = { yes: number; ifNeedBe: number };

/**
 * An option's totals: the aggregate totals when given, otherwise counted
 * from the option's votes.
 */
function scoreOf(
  option: { id: string; votes: OptionVotes },
  getScore?: (optionId: string) => PopularityScore,
): PopularityScore {
  return (
    getScore?.(option.id) ?? {
      yes: option.votes.yes.length,
      ifNeedBe: option.votes.ifNeedBe.length,
    }
  );
}

/**
 * Sort order of two options: more available first, then more firm yeses.
 * Negative when `a` ranks ahead of `b`, zero when they tie.
 */
function comparePopularity(a: PopularityScore, b: PopularityScore) {
  const score = ({ yes, ifNeedBe }: PopularityScore) => [
    yes + ifNeedBe,
    yes,
    ifNeedBe,
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
  getScore,
}: {
  options: { id: string }[];
  participants: { id: string; votes: { optionId: string; type: VoteType }[] }[];
  optionId: string;
  /** Aggregate totals per option, as for {@link rankOptionsByPopularity}. */
  getScore?: (optionId: string) => PopularityScore;
}) {
  const ranked = rankOptionsByPopularity({ options, participants, getScore });
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
    const order = comparePopularity(
      scoreOf(option, getScore),
      scoreOf(chosen, getScore),
    );
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

/**
 * The participants a booking emails. An aggregate results host never sees
 * who responded, so their choice is all or none: explicit ids are ignored,
 * otherwise a known id (such as the host's own) would single out that
 * respondent's address. Elsewhere the host's per-participant selection
 * stands. Participants without an email cannot be notified either way.
 */
export function resolveNotifyParticipantIds({
  participants,
  notifyParticipantIds,
  notifyAllParticipants,
  aggregateResultsOnly,
}: {
  participants: { id: string; email: string | null }[];
  notifyParticipantIds: string[];
  notifyAllParticipants: boolean;
  aggregateResultsOnly: boolean;
}) {
  const selected = new Set(aggregateResultsOnly ? [] : notifyParticipantIds);
  return participants
    .filter(
      (participant) =>
        !!participant.email &&
        (notifyAllParticipants || selected.has(participant.id)),
    )
    .map((participant) => participant.id);
}

/**
 * A hidden tally stays on the server: with hideScores, an aggregate results
 * poll sends its per-option totals only to a viewer who has responded, as
 * the vote page does. A non-aggregate poll is returned unchanged; its scores
 * are derived from participants, which are filtered separately.
 */
export function withholdAggregateScores({
  poll,
  viewerHasResponded,
}: {
  poll: PollDetails;
  viewerHasResponded: boolean;
}): PollDetails {
  if (!poll.aggregateResultsOnly || !poll.hideScores || viewerHasResponded) {
    return poll;
  }
  return {
    ...poll,
    aggregateVotes: poll.aggregateVotes?.map(({ optionId }) => ({
      optionId,
      yes: 0,
      ifNeedBe: 0,
      no: 0,
      skip: 0,
    })),
  };
}
