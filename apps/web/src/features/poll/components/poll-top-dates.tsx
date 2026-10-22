"use client";

import { cn } from "@rallly/ui";
import { VoteBar } from "@/features/poll/components/vote-bar";
import type { VoteType } from "@/features/poll/constants";
import {
  EventDate,
  EventTimeRange,
} from "@/features/scheduled-event/components/event-date-time";

type TopOption = {
  id: string;
  startTime: Date;
  duration: number;
  votes: { type: VoteType; count: number }[];
};

export function PollTopDates({
  options,
  participantCount,
  timeZone,
  className,
}: {
  options: TopOption[];
  participantCount: number;
  timeZone: string | null;
  className?: string;
}) {
  return (
    <ul className={cn("divide-y divide-border", className)}>
      {options.map((option) => {
        const allDay = option.duration === 0;
        const count = (type: VoteType) =>
          option.votes.find((vote) => vote.type === type)?.count ?? 0;

        return (
          <li key={option.id} className="space-y-1.5 py-2 first:pt-0 last:pb-0">
            <div className="flex items-baseline justify-between gap-3">
              <EventDate
                value={option.startTime}
                allDay={allDay}
                timeZone={timeZone}
                preset="weekdayMonthDayShort"
                className="min-w-0 truncate"
              />
              <EventTimeRange
                start={option.startTime}
                end={
                  new Date(
                    option.startTime.getTime() + option.duration * 60_000,
                  )
                }
                allDay={allDay}
                timeZone={timeZone}
                className="shrink-0 text-muted-foreground"
              />
            </div>
            <VoteBar
              className="w-full"
              yes={count("yes")}
              ifNeedBe={count("ifNeedBe")}
              total={participantCount}
            />
          </li>
        );
      })}
    </ul>
  );
}
