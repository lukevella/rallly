import { instantToWallTime } from "@/lib/datetime/wall-time";
import type {
  Ballot,
  BallotSource,
  BallotTallyEntry,
  BallotViewer,
  BallotVote,
} from "./types";

export type PollInviteStatus = "sent" | "opened" | "responded";

/**
 * Revoked invites are filtered out by the read, so they never reach here.
 * Responding always consumes the invite, so a joined participant outranks an
 * open that may or may not have happened first.
 */
export function derivePollInviteStatus(invite: {
  openedAt: Date | null;
  participantId: string | null;
}): PollInviteStatus {
  if (invite.participantId) {
    return "responded";
  }
  if (invite.openedAt) {
    return "opened";
  }
  return "sent";
}

/**
 * The per invitee link, relative. Shared by the email and the host's copy
 * action so the two can never point at different places. The same `token`
 * param carries a response's edit token: once the invitee responds their
 * response takes the invite's token, so this link keeps editing it.
 */
export function getPollInvitePath({
  pollId,
  token,
}: {
  pollId: string;
  token: string;
}) {
  return `/invite/${pollId}?token=${token}`;
}

/**
 * Narrows the shared ballot to what one viewer may see. Scores stay hidden
 * until the viewer has responded when the poll hides them, and other
 * people's names never leave the server when it hides participants.
 */
export function projectBallot({
  source,
  viewer,
}: {
  source: BallotSource;
  viewer: BallotViewer;
}): Ballot {
  const linked = new Set(viewer.linkedResponseIds);
  const isOwn = (response: BallotSource["responses"][number]) =>
    linked.has(response.id) ||
    (viewer.userId !== null && response.userId === viewer.userId);

  // The response an edit link names comes first, so it is the one the ballot
  // opens. Sort is stable, so the rest stay newest first.
  const ownResponses = source.responses
    .filter(isOwn)
    .sort((a, b) => Number(linked.has(b.id)) - Number(linked.has(a.id)))
    .map(({ id, name, votes }) => ({ id, name, votes }));

  const showScores = !source.hideScores || ownResponses.length > 0;

  let tallies: Ballot["tallies"] = null;
  if (showScores) {
    tallies = Object.fromEntries(
      source.options.map((option) => [option.id, [] as BallotTallyEntry[]]),
    );
    for (const response of source.responses) {
      const name =
        isOwn(response) || !source.hideParticipants ? response.name : null;
      for (const [optionId, vote] of Object.entries(response.votes)) {
        if (vote !== "no") {
          tallies[optionId]?.push({ responseId: response.id, name, vote });
        }
      }
    }
  }

  return {
    pollId: source.pollId,
    timeZone: source.timeZone,
    isDatePoll: source.options.every((option) => option.duration === 0),
    allowTentativeVotes: source.allowTentativeVotes,
    requireParticipantEmail: source.requireParticipantEmail,
    canRespond: source.status === "open",
    options: source.options.map((option) => ({
      id: option.id,
      startTime: option.startTime.toISOString(),
      duration: option.duration,
    })),
    tallies,
    responseCount: source.responses.length,
    ownResponses,
  };
}

export type BallotGroup = { key: string; optionIds: string[] };

/**
 * Time slots grouped by their calendar day in `timeZone`, dates by month.
 * Callers pass "UTC" for date polls and floating time polls, whose stored
 * values are wall times. Order is kept, so groups come out chronological.
 */
export function groupBallotOptions({
  options,
  isDatePoll,
  timeZone,
}: {
  options: Ballot["options"];
  isDatePoll: boolean;
  timeZone: string;
}): BallotGroup[] {
  const groups: BallotGroup[] = [];
  for (const option of options) {
    const wallTime = instantToWallTime(
      new Date(option.startTime),
      isDatePoll ? "UTC" : timeZone,
    );
    const key = wallTime.slice(0, isDatePoll ? 7 : 10);
    const last = groups[groups.length - 1];
    if (last?.key === key) {
      last.optionIds.push(option.id);
    } else {
      groups.push({ key, optionIds: [option.id] });
    }
  }
  return groups;
}

/**
 * How many people can make an option: everyone who said yes or if need be,
 * with the viewer's saved answer swapped for the one they are choosing now.
 */
export function availableCount({
  entries,
  activeResponseId,
  liveVote,
}: {
  entries: BallotTallyEntry[];
  activeResponseId: string | null;
  liveVote: BallotVote | undefined;
}): number {
  const others = entries.filter(
    (entry) => entry.responseId !== activeResponseId,
  ).length;
  return others + (liveVote === "yes" || liveVote === "ifNeedBe" ? 1 : 0);
}

/**
 * Whether an option can no longer be attended. Zoned slots compare instants.
 * Floating slots and dates are wall times, read against the viewer's own
 * clock: a date is past once that day has ended where the viewer is.
 */
export function isOptionPast({
  startTime,
  isDatePoll,
  isFloating,
  now,
  viewerTimeZone,
}: {
  startTime: string;
  isDatePoll: boolean;
  isFloating: boolean;
  now: Date;
  viewerTimeZone: string;
}): boolean {
  if (!isDatePoll && !isFloating) {
    return new Date(startTime).getTime() < now.getTime();
  }
  const viewerWallTime = instantToWallTime(now, viewerTimeZone);
  const optionWallTime = startTime.slice(0, 19);
  return isDatePoll
    ? optionWallTime.slice(0, 10) < viewerWallTime.slice(0, 10)
    : optionWallTime < viewerWallTime;
}

/** The answer a click on a row moves to. If need be is skipped when the poll disallows it. */
export function nextVote(
  current: BallotVote | undefined,
  allowTentativeVotes: boolean,
): BallotVote {
  switch (current) {
    case undefined:
    case "no":
      return "yes";
    case "yes":
      return allowTentativeVotes ? "ifNeedBe" : "no";
    case "ifNeedBe":
      return "no";
  }
}
