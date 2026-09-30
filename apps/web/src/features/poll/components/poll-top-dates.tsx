"use client";

import { cn } from "@rallly/ui";
import { Card } from "@rallly/ui/card";
import { VoteBar } from "@/features/poll/components/vote-bar";
import type { VoteType } from "@/features/poll/constants";
import {
  EventCalendarCard,
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
    <ul className={cn("grid gap-4 sm:grid-cols-3", className)}>
      {options.map((option) => {
        const allDay = option.duration === 0;
        const count = (type: VoteType) =>
          option.votes.find((vote) => vote.type === type)?.count ?? 0;

        return (
          <li key={option.id}>
            <Card className="flex h-full flex-col gap-4 p-3.5">
              <div className="flex items-center gap-3">
                <EventCalendarCard
                  start={option.startTime}
                  allDay={allDay}
                  timeZone={timeZone}
                />
                <div className="min-w-0 text-sm">
                  <EventDate
                    value={option.startTime}
                    allDay={allDay}
                    timeZone={timeZone}
                    preset="weekday"
                    className="block truncate font-medium"
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
                    className="block truncate text-muted-foreground"
                  />
                </div>
              </div>
              <VoteBar
                className="mt-auto w-full"
                yes={count("yes")}
                ifNeedBe={count("ifNeedBe")}
                total={participantCount}
              />
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
