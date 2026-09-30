"use client";
import { cn } from "@rallly/ui";
import type { MonthGridDayProps } from "@rallly/ui/month-grid";
import { MonthGrid } from "@rallly/ui/month-grid";
import * as React from "react";
import VoteIcon from "@/features/poll/components/vote-icon";
import type { VoteType } from "@/features/poll/constants";
import {
  nextVoteType,
  useSetVote,
  useVote,
  useVoteForm,
  useVotesByOption,
} from "@/features/poll/vote/components/vote-form";
import { VoteScore } from "@/features/poll/vote/components/vote-score";
import type { VoteResult, VoteViewProps } from "@/features/poll/vote/types";
import { useTranslation } from "@/i18n/client";
import { useDateTimeConfig } from "@/lib/datetime/client";
import { getLocaleDefaults } from "@/lib/datetime/locales";
import { useHydrated } from "@/lib/datetime/use-hydrated";
import { toISODate } from "@/lib/datetime/utils";

/**
 * The tint each vote gives its day, applied through DayPicker's modifiers.
 * No keeps the plain surface: a new response is a no on every option, so
 * tinting it would make a fresh month a wall of red. The icon in the corner
 * is what states the vote, so colour is never alone.
 */
const modifiersClassNames: Record<string, string> = {
  // A day the poll does not offer is recessed, so the month reads as a
  // calendar and the votable days stand out as the surface.
  notOption: "bg-muted/40",
  voteYes: "bg-green-100 dark:bg-green-500/20",
  voteIfNeedBe: "bg-amber-100 dark:bg-amber-500/20",
};

/** Months the options fall in, so the calendar opens on the first one. */
function getMonthRange(results: VoteResult[]) {
  let first: Date | undefined;
  let last: Date | undefined;
  for (const result of results) {
    const month = new Date(
      Date.UTC(
        result.startTime.getUTCFullYear(),
        result.startTime.getUTCMonth(),
        1,
      ),
    );
    if (!first || month < first) {
      first = month;
    }
    if (!last || month > last) {
      last = month;
    }
  }
  return { first, last };
}

type DayContext = {
  byDate: Map<string, VoteResult>;
  savedVotes: Map<string, VoteType>;
  participantCount: number | null;
  hasSavedResponse: boolean;
  allowTentativeVotes: boolean;
  canVote: boolean;
};

const DayContextValue = React.createContext<DayContext | null>(null);

/** The contents of a day the poll offers: its number, vote and tally. */
function OptionDayContent({
  result,
  dayNumber,
}: {
  result: VoteResult;
  dayNumber: React.ReactNode;
}) {
  const ctx = React.useContext(DayContextValue);
  const { value, isEditing } = useVote(result.optionId);
  const savedVote = ctx?.savedVotes.get(result.optionId);
  const shown = isEditing ? value : savedVote;

  return (
    <>
      <span className="flex w-full items-start justify-between gap-1">
        <span aria-hidden="true" className="tabular-nums">
          {dayNumber}
        </span>
        {/* VoteIcon carries its own title, so the vote is announced
            without the cell repeating it. */}
        {shown ? <VoteIcon type={shown} size="sm" /> : null}
      </span>
      <VoteScore
        optionId={result.optionId}
        score={result.score}
        savedVote={savedVote}
        participantCount={ctx?.participantCount ?? null}
        hasSavedResponse={ctx?.hasSavedResponse ?? false}
        allowTentativeVotes={ctx?.allowTentativeVotes ?? true}
        className="w-full"
      />
    </>
  );
}

/**
 * One day. DayPicker owns the button and its click, so this fills it: the
 * poll's own days carry a vote, the rest are inert numbers.
 */
function DayCell({ day, modifiers, className, ...props }: MonthGridDayProps) {
  const ctx = React.useContext(DayContextValue);
  const result = ctx?.byDate.get(toISODate(day.date));
  const interactive = result !== undefined && (ctx?.canVote ?? false);

  return (
    <button
      type="button"
      // The tint comes from the cell's modifier class, so the button is
      // transparent and only owns its layout and focus ring.
      className={cn(
        "flex h-full w-full flex-col justify-between gap-1 rounded-lg p-2 text-left text-sm transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        interactive
          ? "cursor-pointer hover:brightness-[0.97] dark:hover:brightness-125"
          : "cursor-default text-muted-foreground",
        className,
      )}
      {...props}
    >
      {result ? (
        <OptionDayContent result={result} dayNumber={props.children} />
      ) : (
        <span aria-hidden="true" className="tabular-nums">
          {props.children}
        </span>
      )}
    </button>
  );
}

/**
 * The options as a month calendar, one cell per day. Days the poll does not
 * offer are inert, so the month reads as a calendar rather than a list.
 */
export function VoteViewCalendar({
  poll,
  results,
  participantCount,
  response,
  canVote,
}: VoteViewProps) {
  const hydrated = useHydrated();
  const { locale } = useDateTimeConfig();
  const { t } = useTranslation();

  const savedVotes = React.useMemo(() => {
    const map = new Map<string, VoteType>();
    for (const vote of response?.votes ?? []) {
      map.set(vote.optionId, vote.type);
    }
    return map;
  }, [response]);

  // Keyed by calendar date, so a day cell finds its option in one lookup.
  const byDate = React.useMemo(() => {
    const map = new Map<string, VoteResult>();
    for (const result of results) {
      map.set(toISODate(result.startTime), result);
    }
    return map;
  }, [results]);

  const { first, last } = React.useMemo(
    () => getMonthRange(results),
    [results],
  );

  // The votes drive the day tints through DayPicker's modifiers, so a click
  // restyles its cell the same way a prop-driven modifier would.
  const { byOption: currentVotes } = useVotesByOption(savedVotes);
  const modifiers = React.useMemo(() => {
    const yes: Date[] = [];
    const ifNeedBe: Date[] = [];
    for (const result of results) {
      const vote = currentVotes.get(result.optionId);
      if (vote === "yes") {
        yes.push(result.startTime);
      } else if (vote === "ifNeedBe") {
        ifNeedBe.push(result.startTime);
      }
    }
    return { voteYes: yes, voteIfNeedBe: ifNeedBe };
  }, [results, currentVotes]);

  // DayPicker owns the day buttons, so the click is handled here rather
  // than in the cell: it maps the date back to its option and advances it.
  const setVote = useSetVote();
  const form = useVoteForm();
  const handleDayClick = React.useCallback(
    (date: Date) => {
      const result = byDate.get(toISODate(date));
      // Read the mode at click time: DayPicker holds on to this handler, so
      // a captured value would go stale the moment the response is saved.
      if (!result || !canVote || form.getValues("mode") === "view") {
        return;
      }
      setVote(result.optionId, (current) =>
        nextVoteType(current, poll.allowTentativeVotes),
      );
    },
    [byDate, canVote, form, setVote, poll.allowTentativeVotes],
  );

  const ctx = React.useMemo(
    () => ({
      byDate,
      savedVotes,
      participantCount,
      hasSavedResponse: response !== null,
      allowTentativeVotes: poll.allowTentativeVotes,
      canVote,
    }),
    [
      byDate,
      savedVotes,
      participantCount,
      response,
      poll.allowTentativeVotes,
      canVote,
    ],
  );

  // Intl output is not stable across engines, so the calendar waits for the
  // client, exactly as the list's dates do.
  if (!hydrated) {
    return null;
  }

  const { weekStart } = getLocaleDefaults(locale);

  return (
    // A month is a fixed number of weeks, so from lg the grid fills the
    // panel rather than scrolling inside it. Below lg the page scrolls and
    // the weeks keep their natural height.
    <div className="relative flex min-h-0 flex-1 flex-col">
      <DayContextValue.Provider value={ctx}>
        <MonthGrid
          // All-day options are stored as UTC wall time, so the calendar
          // does its month maths in UTC; anything else shifts a day across
          // the boundary.
          timeZone="UTC"
          weekStartsOn={weekStart as 0 | 1 | 2 | 3 | 4 | 5 | 6}
          defaultMonth={first}
          startMonth={first}
          endMonth={last}
          onDayClick={handleDayClick}
          modifiers={{
            notOption: (date: Date) => !byDate.has(toISODate(date)),
            ...modifiers,
          }}
          modifiersClassNames={modifiersClassNames}
          labels={{
            labelNext: () =>
              t("nextMonth", { defaultValue: "Go to the next month" }),
            labelPrevious: () =>
              t("previousMonth", { defaultValue: "Go to the previous month" }),
          }}
          renderDay={(dayProps) => <DayCell {...dayProps} />}
          className="min-h-0 flex-1 p-4"
        />
      </DayContextValue.Provider>
    </div>
  );
}
