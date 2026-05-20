"use client";

import { Skeleton } from "@rallly/ui/skeleton";
import { CalendarIcon, ClockIcon } from "lucide-react";
import * as React from "react";
import { EventMetaItem } from "@/components/event-meta";
import { dayjs } from "@/lib/dayjs";

export function EventDateTime({
  start,
  end,
  allDay,
  timezone,
}: {
  start: Date;
  end: Date;
  allDay: boolean;
  timezone: string;
}) {
  const startD = dayjs(start).tz(timezone);
  const endD = dayjs(end).tz(timezone);
  const date = startD.format("dddd, LL");

  return (
    <>
      <EventMetaItem>
        <CalendarIcon />
        {date}
      </EventMetaItem>
      {allDay ? null : (
        <EventMetaItem>
          <ClockIcon />
          <span>{`${startD.format("LT")} - ${endD.format("LT z")}`}</span>
        </EventMetaItem>
      )}
    </>
  );
}
