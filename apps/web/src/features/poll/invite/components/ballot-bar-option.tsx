"use client";

import { cn } from "@rallly/ui";
import VoteIcon from "@/features/poll/components/vote-icon";
import { useTranslation } from "@/i18n/client";
import type { BallotVote } from "../types";
import { BallotCount } from "./ballot-count";
import { BallotTimeText } from "./ballot-time-text";

const barTint: Record<BallotVote | "none", string> = {
  none: "bg-gray-200 dark:bg-white/10",
  no: "bg-gray-200 dark:bg-white/10",
  yes: "bg-green-100 dark:bg-green-500/25",
  ifNeedBe: "bg-amber-100 dark:bg-amber-500/25",
};

const borderTint: Partial<Record<BallotVote, string>> = {
  yes: "border-green-400 dark:border-green-500/60",
  ifNeedBe: "border-amber-400 dark:border-amber-500/60",
};

const borderHover: Record<BallotVote | "none", string> = {
  none: "hover:border-gray-400 dark:hover:border-gray-500",
  no: "hover:border-gray-400 dark:hover:border-gray-500",
  yes: "hover:border-green-600 dark:hover:border-green-400",
  ifNeedBe: "hover:border-amber-600 dark:hover:border-amber-400",
};

const rowClassName =
  "relative isolate flex min-h-12.5 w-full items-center gap-3 overflow-hidden rounded-xl border bg-card py-1.5 pr-3.5 pl-3 text-left";

/**
 * One option as a single bar: its width is the share of the group who can make
 * it, its colour and the row's border are the viewer's answer, and the mark repeats that answer in a
 * form colour is not needed to read. The whole row is the button, and each
 * press moves to the next answer.
 */
export function BallotBarOption({
  label,
  fullLabel,
  vote,
  canVote,
  isPast,
  onCycle,
  count,
  total,
  compact = false,
  timesChanged = false,
}: {
  label: string;
  /** The full date and time, for assistive technology. */
  fullLabel: string;
  vote: BallotVote | undefined;
  canVote: boolean;
  isPast: boolean;
  onCycle: () => void;
  /** How many people can make it; absent when scores are hidden. */
  count?: number;
  total: number;
  /** A 40px row from lg with a mouse, matching the rows that can be answered. */
  compact?: boolean;
  /** The viewer just changed the time zone or format. */
  timesChanged?: boolean;
}) {
  const { t } = useTranslation();
  const answer = {
    yes: t("yes", { defaultValue: "Yes" }),
    ifNeedBe: t("ifNeedBe", { defaultValue: "If need be" }),
    no: t("no", { defaultValue: "No" }),
    none: t("pending", { defaultValue: "Pending" }),
  }[vote ?? "none"];

  const content = (
    <>
      {count !== undefined && total > 0 ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-0 left-0 -z-10 transition-[width,background-color] duration-200 motion-reduce:transition-none",
            barTint[vote ?? "none"],
          )}
          style={{ width: `${Math.round((count / total) * 100)}%` }}
        />
      ) : null}
      <span aria-hidden="true" className="flex shrink-0">
        {vote ? (
          <VoteIcon
            round
            type={vote}
            className={compact ? "lg:size-4" : undefined}
          />
        ) : (
          <span
            className={cn(
              "size-5 rounded-full border border-gray-500 border-dashed dark:border-gray-400",
              compact && "lg:size-4",
            )}
          />
        )}
      </span>
      <span
        data-testid="option-label"
        className="min-w-0 flex-1 text-pretty text-sm tabular-nums"
      >
        <span className="sr-only">{`${fullLabel}: ${answer}`}</span>
        <span aria-hidden="true">
          <BallotTimeText value={label} changed={timesChanged} />
        </span>
      </span>
      {count !== undefined ? (
        <span className="[&_[data-testid=ballot-tally]]:text-foreground">
          <BallotCount value={count} />
        </span>
      ) : null}
    </>
  );

  return (
    <li
      data-testid="ballot-option"
      data-vote={vote ?? "none"}
      className={cn(isPast && "opacity-60")}
    >
      {canVote ? (
        <button
          type="button"
          onClick={onCycle}
          className={cn(
            rowClassName,
            "scroll-mt-16 scroll-mb-24 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
            vote && borderTint[vote],
            borderHover[vote ?? "none"],
          )}
        >
          {content}
        </button>
      ) : (
        <div
          className={cn(
            rowClassName,
            vote && borderTint[vote],
            compact &&
              "lg:[@media(pointer:fine)]:min-h-10 lg:[@media(pointer:fine)]:py-0.5",
          )}
        >
          {content}
        </div>
      )}
    </li>
  );
}
