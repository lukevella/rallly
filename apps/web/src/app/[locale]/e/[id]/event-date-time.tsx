"use client";

import { CalendarIcon, ClockIcon } from "lucide-react";
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
  timezone: string | null;
}) {
  const startD = timezone ? dayjs(start).tz(timezone) : dayjs(start);
  const endD = timezone ? dayjs(end).tz(timezone) : dayjs(end);
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
