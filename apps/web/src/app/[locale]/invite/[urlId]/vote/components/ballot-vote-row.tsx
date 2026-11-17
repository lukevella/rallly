"use client";

import { cn } from "@rallly/ui";
import * as React from "react";
import VoteIcon from "@/features/poll/components/vote-icon";
import { BallotOptionBreakdown } from "@/features/poll/invite/components/ballot-breakdown";
import { BallotCount } from "@/features/poll/invite/components/ballot-count";
import { BallotTimeText } from "@/features/poll/invite/components/ballot-time-text";
import { BallotVoteMark } from "@/features/poll/invite/components/ballot-vote-mark";
import type {
  Ballot,
  BallotTallies,
  BallotVote,
} from "@/features/poll/invite/types";
import { availableCount, nextVote } from "@/features/poll/invite/utils";
import { useTranslation } from "@/i18n/client";

/** The hover for the rows a mouse can cycle. */
const rowHoverClassName: Record<BallotVote | "none", string> = {
  none: "[@media(pointer:fine)]:hover:border-gray-400 dark:[@media(pointer:fine)]:hover:border-gray-500",
  no: "[@media(pointer:fine)]:hover:border-gray-400 dark:[@media(pointer:fine)]:hover:border-gray-500",
  yes: "[@media(pointer:fine)]:hover:border-green-600 dark:[@media(pointer:fine)]:hover:border-green-400",
  ifNeedBe:
    "[@media(pointer:fine)]:hover:border-amber-600 dark:[@media(pointer:fine)]:hover:border-amber-400",
};

/** Kept in the tree and at a real position, so direct activation still lands. */
const radiosUntilKeyboardClassName =
  "group-not-has-[input:focus-visible]:absolute group-not-has-[input:focus-visible]:right-0 group-not-has-[input:focus-visible]:bottom-0 group-not-has-[input:focus-visible]:gap-0 group-not-has-[input:focus-visible]:opacity-0";
const radioUntilKeyboardClassName =
  "group-not-has-[input:focus-visible]:size-px group-not-has-[input:focus-visible]:overflow-hidden";

const noVotes: (BallotVote | null)[] = [];

/** Where an answer came from: a radio is told when it can't be taken. */
export type BallotVoteSource = "row" | "radio";

/**
 * One option to answer: a fieldset named by its full date and time, its
 * radios, and the count. Memoized, so an answer re-renders only its own row.
 */
export const BallotVoteRow = React.memo(function BallotVoteRow({
  option,
  vote,
  isPast,
  allowTentativeVotes,
  legend,
  label,
  weekday,
  timesChangedAt,
  total,
  tallies,
  activeResponseId,
  breakdownTimeZone,
  onBreakdownOpen,
  onVote,
}: {
  option: Ballot["options"][number];
  vote: BallotVote | undefined;
  isPast: boolean;
  allowTentativeVotes: boolean;
  /** The full date and time, for assistive technology. */
  legend: string;
  /** The time on screen, or a date poll's day. */
  label: string;
  /** A date poll's weekday, shown beside the day. */
  weekday?: string;
  /** When the viewer last changed the time zone or format. */
  timesChangedAt: React.RefObject<number>;
  total: number;
  tallies: BallotTallies | null;
  activeResponseId: string | null;
  /** Makes the count open who answered what; absent when names are withheld. */
  breakdownTimeZone?: string | null;
  onBreakdownOpen: () => void;
  onVote: (optionId: string, vote: BallotVote, from: BallotVoteSource) => void;
}) {
  const { t } = useTranslation();
  const optionId = option.id;
  const votes = tallies?.votes[optionId] ?? noVotes;
  const liveCount = tallies
    ? availableCount({ tallies, votes, activeResponseId, liveVote: vote })
    : null;
  const countId = `count-${optionId}`;
  const answerChoices: BallotVote[] = allowTentativeVotes
    ? ["yes", "ifNeedBe", "no"]
    : ["yes", "no"];
  const answerLabels: Record<BallotVote, string> = {
    yes: t("yes", { defaultValue: "Yes" }),
    ifNeedBe: t("ifNeedBe", { defaultValue: "If need be" }),
    no: t("no", { defaultValue: "No" }),
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: a click and tap shortcut; the radios inside are the keyboard path
    <fieldset
      aria-describedby={liveCount !== null ? countId : undefined}
      disabled={isPast}
      onClick={(event) => {
        // A click or a tap, never for the radios themselves:
        // assistive technology activates those directly.
        if (isPast || (event.target as Element).closest("label, button"))
          return;
        onVote(optionId, nextVote(vote, allowTentativeVotes), "row");
      }}
      className={cn(
        "group relative isolate flex min-h-12.5 min-w-0 flex-wrap items-center gap-x-3 gap-y-2 overflow-hidden rounded-xl border bg-card py-1.5 pr-3.5 pl-3 lg:[@media(pointer:fine)]:min-h-10 lg:[@media(pointer:fine)]:py-0",
        isPast
          ? "opacity-60"
          : [
              "cursor-pointer touch-manipulation [-webkit-tap-highlight-color:transparent]",
              rowHoverClassName[vote ?? "none"],
            ],
        vote === "yes" && "border-green-400 dark:border-green-500/60",
        vote === "ifNeedBe" && "border-amber-400 dark:border-amber-500/60",
      )}
    >
      {/* The full date for readers; the day heading above carries it on screen. */}
      <legend className="sr-only">{legend}</legend>
      {liveCount !== null && total > 0 ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-0 left-0 -z-10 w-full origin-left transition-[transform,background-color] duration-200 motion-reduce:transition-none",
            vote === "yes"
              ? "bg-green-100 dark:bg-green-500/25"
              : vote === "ifNeedBe"
                ? "bg-amber-100 dark:bg-amber-500/25"
                : "bg-gray-200 dark:bg-white/10",
          )}
          // Scaled, not sized, so a changing count animates without layout.
          style={{
            transform: `scaleX(${Math.round((liveCount / total) * 100) / 100})`,
          }}
        />
      ) : null}
      {/* The row shows one mark, as the answer it cycles. */}
      <BallotVoteMark vote={vote} />
      <span
        aria-hidden="true"
        className="flex min-h-9 min-w-0 flex-1 items-center text-sm tabular-nums lg:[@media(pointer:fine)]:min-h-9.5"
      >
        <BallotTimeText
          value={weekday === undefined ? label : { day: label, weekday }}
          changedAt={timesChangedAt}
        />
      </span>
      {liveCount !== null && tallies ? (
        <span
          aria-hidden={breakdownTimeZone === undefined ? true : undefined}
          className="[&_[data-testid=ballot-tally]]:text-foreground"
        >
          <BallotCount
            value={liveCount}
            breakdown={
              breakdownTimeZone === undefined ? undefined : (
                <BallotOptionBreakdown
                  option={option}
                  timeZone={breakdownTimeZone}
                  total={total}
                  tallies={tallies}
                  votes={votes}
                  activeResponseId={activeResponseId}
                  liveVote={vote}
                />
              )
            }
            onBreakdownOpen={onBreakdownOpen}
          />
        </span>
      ) : null}
      {liveCount !== null ? (
        <p id={countId} className="sr-only">
          {t("screenReaderOptionCount", {
            defaultValue:
              "{count, plural, =0 {No one has said they can make this yet} one {# person can make this} other {# people can make this}}",
            count: liveCount,
          })}
        </p>
      ) : null}
      {/* Shrunk away until the keyboard reaches them, and still in
    the tree for a screen reader to step through. */}
      <div className={cn("flex gap-x-3 gap-y-2", radiosUntilKeyboardClassName)}>
        {answerChoices.map((choice) => (
          <label
            key={choice}
            className={cn("relative block", radioUntilKeyboardClassName)}
          >
            <input
              type="radio"
              className="peer absolute inset-0 z-10 m-0 size-full cursor-pointer scroll-mt-16 scroll-mb-24 opacity-0"
              name={`vote-${optionId}`}
              value={choice}
              checked={vote === choice}
              onChange={() => onVote(optionId, choice, "radio")}
            />
            <span
              aria-hidden="true"
              className={cn(
                "flex size-9 items-center justify-center rounded-full border bg-background outline-ring outline-offset-2 transition-[border-color] duration-150 peer-checked:border-2 peer-focus-visible:outline-2 motion-reduce:transition-none [&_svg]:brightness-75 [&_svg]:grayscale peer-checked:[&_svg]:brightness-100 peer-checked:[&_svg]:grayscale-0 lg:[@media(pointer:fine)]:size-6",
                // One colour per answer in every state;
                // only its strength changes.
                choice === "yes" &&
                  "border-green-600/40 peer-checked:border-green-600 peer-hover:border-green-600/70",
                choice === "ifNeedBe" &&
                  "border-amber-500/40 peer-checked:border-amber-500 peer-hover:border-amber-500/70",
                choice === "no" &&
                  "border-gray-500/40 peer-checked:border-gray-500 peer-hover:border-gray-500/70 dark:border-gray-400/40 dark:peer-hover:border-gray-400/70 dark:peer-checked:border-gray-400",
              )}
            >
              <VoteIcon
                round
                type={choice}
                className="size-5 lg:[@media(pointer:fine)]:size-4"
              />
            </span>
            <span className="sr-only">{answerLabels[choice]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
});
