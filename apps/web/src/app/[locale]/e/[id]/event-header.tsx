"use client";

import { cn } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
import { Trans } from "@/i18n/client";
import { dayjs } from "@/lib/dayjs";

export function EventHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <header className={cn("px-4 pb-6", className)}>{children}</header>;
}

export function EventTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={cn(
        "text-balance font-semibold text-foreground text-xl leading-tight tracking-tight",
        className,
      )}
    >
      {children}
    </h1>
  );
}

export function EventSubtitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("mt-1 text-muted-foreground text-sm", className)}>
      {children}
    </p>
  );
}

export function EventStatus({
  status,
  hasEnded,
}: {
  status: "confirmed" | "canceled" | "unconfirmed";
  hasEnded: boolean;
}) {
  if (status === "canceled") {
    return (
      <Badge variant="destructive">
        <Trans i18nKey="eventStatusCanceled" defaults="Canceled" />
      </Badge>
    );
  }
  if (hasEnded) {
    return (
      <Badge variant="default">
        <Trans i18nKey="eventStatusPast" defaults="Past" />
      </Badge>
    );
  }
  return (
    <Badge variant="green">
      <Trans i18nKey="eventStatusUpcoming" defaults="Upcoming" />
    </Badge>
  );
}

export function EventDate({
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
