import { customAlphabet } from "nanoid";
import type { PollConferencing } from "@/features/conferencing/schema";
import { isProConferencingProvider } from "@/features/conferencing/utils";
import type { VoteType } from "@/features/poll/constants";
import type {
  OptionState,
  PollComment,
  PollParticipant,
  PollResultOption,
} from "@/features/poll/types";
import type { SpaceTier } from "@/features/space/schema";
import { instantToWallTime } from "@/lib/datetime/wall-time";

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
  const score = (votes: OptionVotes) => [
    votes.yes.length + votes.ifNeedBe.length,
    votes.yes.length,
    votes.ifNeedBe.length,
  ];
  return options
    .map((option) => ({
      ...option,
      votes: votesByOptionId.get(option.id) ?? {
        yes: [],
        ifNeedBe: [],
        no: [],
      },
    }))
    .sort((a, b) => {
      const sa = score(a.votes);
      const sb = score(b.votes);
      for (let i = 0; i < sa.length; i++) {
        if (sa[i] !== sb[i]) return sb[i] - sa[i];
      }
      return 0;
    });
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

export function getOptionAvailability(option: Pick<PollResultOption, "votes">) {
  let availability = 0;
  for (const vote of option.votes) {
    if (vote.type === "yes" || vote.type === "ifNeedBe") {
      availability += vote.count;
    }
  }
  return availability;
}

/**
 * Best is the top score (availability first, yes breaks ties, matching
 * getPollResults); popular is within 75% of the best's availability.
 */
export function classifyOptions(
  options: Pick<PollResultOption, "id" | "votes" | "score">[],
) {
  const topScore = Math.max(0, ...options.map((option) => option.score));
  const bestOption = options.find(
    (option) => option.score === topScore && getOptionAvailability(option) > 0,
  );
  const bestAvailability = bestOption ? getOptionAvailability(bestOption) : 0;

  const states = new Map<string, OptionState>();
  for (const option of options) {
    const availability = getOptionAvailability(option);
    if (bestAvailability > 0 && option.score === topScore) {
      states.set(option.id, "best");
    } else if (
      availability > 0 &&
      bestAvailability > 0 &&
      availability >= bestAvailability * 0.75
    ) {
      states.set(option.id, "popular");
    } else {
      states.set(option.id, "normal");
    }
  }
  return states;
}

export type TimeGridDate = { key: string; sampleStart: Date };
export type TimeGridSlot = {
  key: string;
  startMinutes: number;
  duration: number;
  sampleStart: Date;
};

const SLOT_GAP_MINUTES = 120;

const dayNumber = (dateKey: string) =>
  Date.UTC(
    Number(dateKey.slice(0, 4)),
    Number(dateKey.slice(5, 7)) - 1,
    Number(dateKey.slice(8, 10)),
  ) / DAY_MS;

export function timeGridCellKey(dateKey: string, slotKey: string) {
  return `${dateKey}|${slotKey}`;
}

/**
 * Dates that have options become columns; distinct start/duration slots
 * across the whole poll become rows, so rows line up between dates.
 * `timeZone` must be the zone the grid is displayed in.
 */
export function buildTimeGrid({
  options,
  timeZone,
}: {
  options: Pick<PollResultOption, "id" | "startTime" | "duration">[];
  timeZone: string;
}) {
  const dates = new Map<string, TimeGridDate>();
  const slots = new Map<string, TimeGridSlot>();
  const cells = new Map<string, string>();

  for (const option of options) {
    const wall = instantToWallTime(option.startTime, timeZone);
    const dateKey = wall.slice(0, 10);
    const startMinutes =
      Number(wall.slice(11, 13)) * 60 + Number(wall.slice(14, 16));
    const slotKey = `${startMinutes}:${option.duration}`;
    if (!dates.has(dateKey)) {
      dates.set(dateKey, { key: dateKey, sampleStart: option.startTime });
    }
    if (!slots.has(slotKey)) {
      slots.set(slotKey, {
        key: slotKey,
        startMinutes,
        duration: option.duration,
        sampleStart: option.startTime,
      });
    }
    cells.set(timeGridCellKey(dateKey, slotKey), option.id);
  }

  const sortedDates = [...dates.values()].sort((a, b) =>
    a.key.localeCompare(b.key),
  );
  const sortedSlots = [...slots.values()].sort(
    (a, b) => a.startMinutes - b.startMinutes || a.duration - b.duration,
  );

  const dateGapBefore = new Set<number>();
  sortedDates.forEach((date, index) => {
    const previous = sortedDates[index - 1];
    if (previous && dayNumber(date.key) - dayNumber(previous.key) > 1) {
      dateGapBefore.add(index);
    }
  });
  const slotGapBefore = new Set<number>();
  sortedSlots.forEach((slot, index) => {
    const previous = sortedSlots[index - 1];
    if (
      previous &&
      slot.startMinutes - previous.startMinutes >= SLOT_GAP_MINUTES
    ) {
      slotGapBefore.add(index);
    }
  });

  return {
    dates: sortedDates,
    slots: sortedSlots,
    cells,
    dateGapBefore,
    slotGapBefore,
  };
}
