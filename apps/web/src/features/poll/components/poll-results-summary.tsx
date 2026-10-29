"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@rallly/ui/card";
import { TrophyIcon } from "lucide-react";
import * as React from "react";
import { useParticipants, usePoll } from "@/features/poll/client";
import { IfScoresVisible } from "@/features/poll/components/visibility";
import { placeOptionsByPopularity } from "@/features/poll/utils";
import {
  EventDate,
  EventTimeRange,
} from "@/features/scheduled-event/components/event-date-time";
import { Trans, useTranslation } from "@/i18n/client";

const TOP_OPTIONS = 5;

const placeClassName: Record<number, string> = {
  1: "bg-amber-400 text-white",
  2: "bg-zinc-400 text-white",
  3: "bg-amber-700 text-white",
};

function Place({ place }: { place: number | null }) {
  return (
    <span
      data-testid="results-summary-place"
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full font-medium text-xs tabular-nums",
        place ? placeClassName[place] : null,
        place && !placeClassName[place] ? "bg-muted text-foreground" : null,
        place ? null : "text-muted-foreground",
      )}
    >
      {place ?? "–"}
    </span>
  );
}

/**
 * Yes, if need be and no stacked over the participant count, so the gap left
 * at the end is the participants who did not answer for this option.
 */
function AvailabilityBar({
  yes,
  ifNeedBe,
  no,
  total,
  className,
}: {
  yes: number;
  ifNeedBe: number;
  no: number;
  total: number;
  className?: string;
}) {
  const { t } = useTranslation();
  const width = (count: number) =>
    total > 0 ? `${(count / total) * 100}%` : "0%";
  return (
    <div
      role="img"
      aria-label={t("pollResultsSummaryBarLabel", {
        defaultValue:
          "{yes} yes, {ifNeedBe} if need be, {no} no, out of {total, plural, one {1 participant} other {# participants}}",
        yes,
        ifNeedBe,
        no,
        total,
      })}
      className={cn("flex h-2 overflow-hidden rounded-sm bg-muted", className)}
    >
      <div className="h-full bg-green-500" style={{ width: width(yes) }} />
      <div className="h-full bg-amber-400" style={{ width: width(ifNeedBe) }} />
      <div
        className="h-full bg-gray-300 dark:bg-gray-600"
        style={{ width: width(no) }}
      />
    </div>
  );
}

function Legend({ showTentative }: { showTentative: boolean }) {
  const { t } = useTranslation();
  const items = [
    { className: "bg-green-500", label: t("yes", { defaultValue: "Yes" }) },
    ...(showTentative
      ? [
          {
            className: "bg-amber-400",
            label: t("ifNeedBe", { defaultValue: "If need be" }),
          },
        ]
      : []),
    {
      className: "bg-gray-300 dark:bg-gray-600",
      label: t("no", { defaultValue: "No" }),
    },
    {
      className: "bg-muted",
      label: t("pollResultsSummaryNoResponse", {
        defaultValue: "No response",
      }),
    },
  ];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span className={cn("size-2 rounded-sm", item.className)} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/**
 * The poll's options ranked by how many participants can attend, with each
 * option's votes as a stacked bar, so the best options read at a glance
 * without scanning the whole grid.
 */
export function PollResultsSummary() {
  const poll = usePoll();
  const { participants } = useParticipants();
  const [showAll, setShowAll] = React.useState(false);

  const placed = React.useMemo(
    () => placeOptionsByPopularity({ options: poll.options, participants }),
    [poll.options, participants],
  );

  // A single option has nothing to compare, and a scheduled or canceled
  // poll shows its outcome instead.
  if (
    participants.length === 0 ||
    poll.options.length < 2 ||
    poll.status === "scheduled" ||
    poll.status === "canceled"
  ) {
    return null;
  }

  const showTentative =
    poll.allowTentativeVotes ||
    placed.some((option) => option.votes.ifNeedBe.length > 0);
  const visible = showAll ? placed : placed.slice(0, TOP_OPTIONS);

  return (
    <IfScoresVisible>
      <Card data-testid="poll-results-summary">
        <CardHeader className="border-b">
          <CardTitle>
            <TrophyIcon className="size-4 text-muted-foreground" />
            <Trans i18nKey="pollResultsSummaryTitle" defaults="Best options" />
          </CardTitle>
          <CardDescription>
            <Trans
              i18nKey="pollResultsSummaryDescription"
              defaults="Ranked by how many participants can attend"
            />
          </CardDescription>
        </CardHeader>
        <ol className="divide-y">
          {visible.map((option) => {
            const allDay = option.duration === 0;
            return (
              <li
                key={option.id}
                className="flex items-center gap-3 px-3 py-2.5 sm:px-4"
              >
                <Place place={option.place} />
                <div className="min-w-0 flex-1 text-sm">
                  {/* The long date does not fit beside the bar on a phone */}
                  <EventDate
                    value={option.startTime}
                    allDay={allDay}
                    timeZone={poll.timeZone}
                    preset="weekdayMonthDayShort"
                    className="block truncate font-medium sm:hidden"
                  />
                  <EventDate
                    value={option.startTime}
                    allDay={allDay}
                    timeZone={poll.timeZone}
                    preset="weekdayMonthDay"
                    className="hidden truncate font-medium sm:block"
                  />
                  {allDay ? null : (
                    <EventTimeRange
                      start={option.startTime}
                      end={
                        new Date(
                          option.startTime.getTime() + option.duration * 60_000,
                        )
                      }
                      allDay={allDay}
                      timeZone={poll.timeZone}
                      className="block truncate text-muted-foreground"
                    />
                  )}
                </div>
                <AvailabilityBar
                  className="w-20 shrink-0 sm:w-40"
                  yes={option.votes.yes.length}
                  ifNeedBe={option.votes.ifNeedBe.length}
                  no={option.votes.no.length}
                  total={participants.length}
                />
                <span
                  aria-hidden
                  data-testid="results-summary-score"
                  className="w-12 shrink-0 text-right text-sm tabular-nums"
                >
                  {option.available}/{participants.length}
                </span>
              </li>
            );
          })}
        </ol>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-3 py-2.5 sm:px-4">
          <Legend showTentative={showTentative} />
          {placed.length > TOP_OPTIONS ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAll((value) => !value)}
            >
              {showAll ? (
                <Trans
                  i18nKey="pollResultsSummaryShowLess"
                  defaults="Show top {count}"
                  values={{ count: TOP_OPTIONS }}
                />
              ) : (
                <Trans
                  i18nKey="pollResultsSummaryShowAll"
                  defaults="{count, plural, one {Show # option} other {Show all # options}}"
                  values={{ count: placed.length }}
                />
              )}
            </Button>
          ) : null}
        </div>
      </Card>
    </IfScoresVisible>
  );
}
