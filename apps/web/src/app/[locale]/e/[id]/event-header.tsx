"use client";

import { dayjs } from "@/lib/dayjs";

export function EventDateLine({
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
  const time = allDay
    ? null
    : `${startD.format("LT")} – ${endD.format("LT z")}`;

  return (
    <div className="mt-3">
      <p className="font-medium text-base text-foreground">{date}</p>
      {time ? (
        <p className="mt-0.5 text-muted-foreground text-sm">{time}</p>
      ) : null}
    </div>
  );
}
