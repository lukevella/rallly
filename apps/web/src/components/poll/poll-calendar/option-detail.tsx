"use client";

import { Trans } from "@/i18n/client";
import { dayjs } from "@/lib/dayjs";

import { ConnectedScoreSummary } from "../score-summary";
import { VoteSummary } from "../vote-summary";
import type { CalendarOption } from "./use-poll-calendar";

/**
 * Detail for a selected day: each option with its time, availability score and
 * the full who-voted-what breakdown — the same detail the grid/mobile view
 * exposes, so nothing is lost in the calendar.
 */
export function DayDetail({
  dayKey,
  options,
}: {
  dayKey: string;
  options: CalendarOption[];
}) {
  const date = dayjs(`${dayKey}T12:00:00`);
  return (
    <div>
      <h3 className="mb-3 font-semibold text-sm">{date.format("dddd, LL")}</h3>
      <div className="divide-y overflow-hidden rounded-lg border">
        {options.map((option) => (
          <div key={option.optionId} className="space-y-3 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium text-sm">
                {option.duration > 0 ? (
                  `${option.start.format("LT")} – ${option.end.format("LT")}`
                ) : (
                  <Trans i18nKey="allDay" defaults="All day" />
                )}
              </div>
              <ConnectedScoreSummary optionId={option.optionId} />
            </div>
            <VoteSummary optionId={option.optionId} />
          </div>
        ))}
      </div>
    </div>
  );
}
