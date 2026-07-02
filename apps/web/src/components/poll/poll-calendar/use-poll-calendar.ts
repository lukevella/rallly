"use client";

import * as React from "react";

import { usePoll } from "@/components/poll-context";
import { dayjs } from "@/lib/dayjs";
import { useDayjs } from "@/utils/dayjs";

import { useParticipants } from "../../participants-provider";

type CalendarDayjs = ReturnType<typeof dayjs>;

export type CalendarOption = {
  optionId: string;
  start: CalendarDayjs;
  end: CalendarDayjs;
  duration: number;
  yes: number;
  ifNeedBe: number;
  no: number;
  /** People who can attend (yes + ifNeedBe) — the "best case" availability. */
  available: number;
};

export type PollCalendarData = {
  pollType: "date" | "timeSlot";
  /** Options grouped by their local calendar day, keyed by `YYYY-MM-DD`. */
  optionsByDay: Record<string, CalendarOption[]>;
  /** Sorted day keys that have at least one option. */
  dayKeys: string[];
  /** Local-noon dates for each option day — feeds the headless date picker. */
  selectionDates: Date[];
  /** Local-noon date of the earliest option, for initial navigation. */
  firstOptionDate?: Date;
  /** Highest availability across every option — used to scale the heat map. */
  highScore: number;
  participantCount: number;
  timeZone: string | null;
};

const toDayKeyDate = (dayKey: string) => new Date(`${dayKey}T12:00:00`);

/**
 * Aggregates a poll's options into a calendar-friendly shape: options bucketed
 * by local day with per-option availability scores. All-day options are read as
 * floating (UTC) dates so every viewer sees the same calendar day; timed options
 * are converted to the viewer's target time zone (mirrors createOptionsContextValue).
 */
export function usePollCalendar(): PollCalendarData {
  const { poll, getScore, highScore } = usePoll();
  const { adjustTimeZone } = useDayjs();
  const { participants } = useParticipants();

  return React.useMemo(() => {
    const pollType: PollCalendarData["pollType"] = poll.options[0]?.duration
      ? "timeSlot"
      : "date";

    const localize = (date: Date) =>
      pollType === "timeSlot"
        ? adjustTimeZone(date, !poll.timeZone)
        : dayjs(date).utc();

    const optionsByDay: Record<string, CalendarOption[]> = {};

    for (const option of poll.options) {
      const start = localize(option.startTime);
      const { yes, ifNeedBe, no } = getScore(option.id);
      const dayKey = start.format("YYYY-MM-DD");

      if (!optionsByDay[dayKey]) {
        optionsByDay[dayKey] = [];
      }
      optionsByDay[dayKey].push({
        optionId: option.id,
        start,
        end: start.add(option.duration, "minute"),
        duration: option.duration,
        yes,
        ifNeedBe,
        no,
        available: yes + ifNeedBe,
      });
    }

    for (const dayKey of Object.keys(optionsByDay)) {
      optionsByDay[dayKey].sort(
        (a, b) => a.start.valueOf() - b.start.valueOf(),
      );
    }

    const dayKeys = Object.keys(optionsByDay).sort();

    return {
      pollType,
      optionsByDay,
      dayKeys,
      selectionDates: dayKeys.map(toDayKeyDate),
      firstOptionDate: dayKeys.length ? toDayKeyDate(dayKeys[0]) : undefined,
      highScore,
      participantCount: participants.length,
      timeZone: poll.timeZone,
    };
  }, [poll, getScore, highScore, adjustTimeZone, participants.length]);
}

/** The option with the highest availability on a given day. */
export function getDayBestOption(options: CalendarOption[]) {
  return options.reduce((best, option) =>
    option.available > best.available ? option : best,
  );
}
