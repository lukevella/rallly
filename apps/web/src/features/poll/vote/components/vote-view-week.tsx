"use client";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";
import VoteIcon from "@/features/poll/components/vote-icon";
import { VoteSegmentedControl } from "@/features/poll/components/vote-segmented-control";
import type { VoteType } from "@/features/poll/constants";
import { useVote } from "@/features/poll/vote/components/vote-form";
import { VoteScore } from "@/features/poll/vote/components/vote-score";
import type { VoteResult, VoteViewProps } from "@/features/poll/vote/types";
import { Trans, useTranslation } from "@/i18n/client";
import { useDateTime, useDateTimeConfig } from "@/lib/datetime/client";
import { getLocaleDefaults } from "@/lib/datetime/locales";
import { getCalendarDate } from "@/lib/datetime/utils";
import { getBrowserTimeZone } from "@/lib/utils/date-time-utils";

const DAY_MS = 24 * 60 * 60 * 1000;

type Day = { key: string; date: Date; results: VoteResult[] };
type Week = { start: Date; days: Day[] };

/**
 * Groups options into weeks of seven days, keeping only weeks that hold at
 * least one option. Navigation then steps between weeks that have something
 * to vote on rather than walking through empty ones.
 */
function buildWeeks(
  results: VoteResult[],
  weekStart: number,
  keyOf: (value: Date) => string,
): Week[] {
  const byDay = new Map<string, VoteResult[]>();
  for (const result of results) {
    const key = keyOf(result.startTime);
    const bucket = byDay.get(key);
    if (bucket) {
      bucket.push(result);
    } else {
      byDay.set(key, [result]);
    }
  }

  const weeks = new Map<number, Week>();
  for (const [key, dayResults] of byDay) {
    // The key is a calendar date, so midnight UTC anchors it without the
    // viewer's offset shifting which day it lands on.
    const date = new Date(`${key}T00:00:00Z`);
    const offset = (date.getUTCDay() - weekStart + 7) % 7;
    const start = new Date(date.getTime() - offset * DAY_MS);
    const stamp = start.getTime();

    let week = weeks.get(stamp);
    if (!week) {
      week = {
        start,
        days: Array.from({ length: 7 }, (_, index) => {
          const dayDate = new Date(stamp + index * DAY_MS);
          return {
            key: dayDate.toISOString().slice(0, 10),
            date: dayDate,
            results: [],
          };
        }),
      };
      weeks.set(stamp, week);
    }
    const day = week.days.find((candidate) => candidate.key === key);
    if (day) {
      day.results = dayResults.sort(
        (a, b) => a.startTime.getTime() - b.startTime.getTime(),
      );
    }
  }

  return [...weeks.values()].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
}

function TimeOption({
  result,
  timeZone,
  readZone,
  savedVote,
  participantCount,
  hasSavedResponse,
  allowTentativeVotes,
  canVote,
}: {
  result: VoteResult;
  timeZone: string | null;
  readZone: string | undefined;
  savedVote: VoteType | undefined;
  participantCount: number | null;
  hasSavedResponse: boolean;
  allowTentativeVotes: boolean;
  canVote: boolean;
}) {
  const { formatDateTime, formatDateTimeRange } = useDateTime();
  const { value, setVote, isEditing } = useVote(result.optionId);
  const shown = isEditing ? value : savedVote;
  const end = new Date(result.startTime.getTime() + result.duration * 60_000);

  const label = `${formatDateTime(result.startTime, "dateFull", {
    timeZone: readZone,
  })}, ${formatDateTimeRange(result.startTime, end, "time", {
    timeZone: readZone,
  })}`;

  return (
    <li className="rounded-lg border bg-card p-2">
      <p className="truncate font-medium text-sm tabular-nums">
        {formatDateTimeRange(result.startTime, end, "time", {
          timeZone: readZone,
        })}
      </p>
      <div className="mt-1.5">
        <VoteScore
          optionId={result.optionId}
          score={result.score}
          savedVote={savedVote}
          participantCount={participantCount}
          hasSavedResponse={hasSavedResponse}
          allowTentativeVotes={allowTentativeVotes}
          className="w-full"
        />
      </div>
      <div className="mt-2">
        {canVote && isEditing ? (
          <VoteSegmentedControl
            value={value}
            onChange={setVote}
            optionLabel={label}
            allowTentativeVotes={allowTentativeVotes}
            className="w-full"
          />
        ) : (
          <span className="flex h-9 items-center justify-center">
            {shown ? <VoteIcon type={shown} /> : null}
          </span>
        )}
      </div>
    </li>
  );
}

/**
 * A week of seven day columns with each day's times stacked beneath it.
 * Only weeks holding options are reachable, so navigation never lands on an
 * empty one.
 */
export function VoteViewWeek({
  poll,
  results,
  participantCount,
  response,
  canVote,
}: VoteViewProps) {
  const { t } = useTranslation();
  const { locale } = useDateTimeConfig();
  const { formatDateTime, formatDateTimeRange } = useDateTime();
  const [hideEmptyDays, setHideEmptyDays] = React.useState(false);
  const [weekIndex, setWeekIndex] = React.useState(0);

  // A zoned time poll is read in the viewer's zone; a floating one is
  // stored as UTC wall time and read back in UTC.
  const readZone = poll.timeZone ? undefined : "UTC";

  const savedVotes = React.useMemo(() => {
    const map = new Map<string, VoteType>();
    for (const vote of response?.votes ?? []) {
      map.set(vote.optionId, vote.type);
    }
    return map;
  }, [response]);

  const { weekStart } = getLocaleDefaults(locale);
  // The calendar date an option falls on, in the zone it is read in, so a
  // late-evening slot groups under its own day rather than the next one.
  const keyZone = readZone ?? getBrowserTimeZone();
  const weeks = React.useMemo(
    () =>
      buildWeeks(results, weekStart, (value) =>
        getCalendarDate(value, keyZone),
      ),
    [results, weekStart, keyZone],
  );

  // Options can change under the viewer (the past filter, a refresh), so
  // clamp rather than trusting the stored index.
  const index = Math.min(weekIndex, Math.max(weeks.length - 1, 0));
  const week = weeks[index];

  if (!week) {
    return null;
  }

  const days = hideEmptyDays
    ? week.days.filter((day) => day.results.length > 0)
    : week.days;
  const emptyDayCount = week.days.length - days.length;
  // Kept while hiding is on, so a fully booked week still offers the way
  // back.
  const hasEmptyDays =
    hideEmptyDays || week.days.some((day) => day.results.length === 0);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-2">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("previousWeek", { defaultValue: "Previous week" })}
            disabled={index === 0}
            onClick={() => setWeekIndex(index - 1)}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("nextWeek", { defaultValue: "Next week" })}
            disabled={index >= weeks.length - 1}
            onClick={() => setWeekIndex(index + 1)}
          >
            <ChevronRightIcon />
          </Button>
          {/* A range rather than one month: a week can straddle two, and
              formatRange collapses "May 4 – 10" when it does not. */}
          <p className="ms-1 font-medium text-sm">
            {formatDateTimeRange(
              week.start,
              new Date(week.start.getTime() + 6 * DAY_MS),
              "date",
              { timeZone: "UTC" },
            )}
          </p>
        </div>
        {hasEmptyDays ? (
          <Button
            type="button"
            variant="ghost"
            aria-pressed={hideEmptyDays}
            onClick={() => setHideEmptyDays(!hideEmptyDays)}
          >
            {hideEmptyDays ? (
              <Trans i18nKey="showEmptyDays" defaults="Show empty days" />
            ) : (
              <Trans i18nKey="hideEmptyDays" defaults="Hide empty days" />
            )}
          </Button>
        ) : null}
      </div>
      <div className="lg:scrollbar-thin min-h-0 flex-1 lg:overflow-y-auto">
        <div
          className={cn(
            "grid gap-2 px-4 pb-4",
            // Seven across only when there is room; below that the columns
            // would be too narrow to hold a time and its vote control.
            days.length > 0 && "grid-cols-2 sm:grid-cols-4 lg:grid-cols-7",
          )}
          style={
            hideEmptyDays && days.length < 7
              ? {
                  gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
                }
              : undefined
          }
        >
          {days.map((day) => (
            <section key={day.key} className="min-w-0">
              <h3 className="sticky top-0 z-10 bg-card pb-2 text-center">
                {/* The two lines read as one date to a screen reader, which
                    would otherwise hear "Sunday" and "4" as separate words. */}
                <span className="sr-only">
                  {formatDateTime(day.date, "dateFull", { timeZone: "UTC" })}
                </span>
                <span aria-hidden="true">
                  <span className="block text-muted-foreground text-xs">
                    {formatDateTime(day.date, "weekday", { timeZone: "UTC" })}
                  </span>
                  <span className="block font-medium text-sm tabular-nums">
                    {formatDateTime(day.date, "day", { timeZone: "UTC" })}
                  </span>
                </span>
              </h3>
              {day.results.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {day.results.map((result) => (
                    <TimeOption
                      key={result.optionId}
                      result={result}
                      timeZone={poll.timeZone}
                      readZone={readZone}
                      savedVote={savedVotes.get(result.optionId)}
                      participantCount={participantCount}
                      hasSavedResponse={response !== null}
                      allowTentativeVotes={poll.allowTentativeVotes}
                      canVote={canVote}
                    />
                  ))}
                </ul>
              ) : (
                <p className="rounded-lg border border-dashed py-4 text-center text-muted-foreground text-xs">
                  <Trans i18nKey="noTimesShort" defaults="None" />
                </p>
              )}
            </section>
          ))}
        </div>
        {hideEmptyDays && emptyDayCount > 0 ? (
          <p className="px-4 pb-4 text-muted-foreground text-xs">
            <Trans
              i18nKey="emptyDaysHidden"
              defaults="{count, plural, one {# day hidden} other {# days hidden}}"
              values={{ count: emptyDayCount }}
            />
          </p>
        ) : null}
      </div>
    </div>
  );
}
