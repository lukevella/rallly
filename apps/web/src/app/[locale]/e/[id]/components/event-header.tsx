"use client";

import { cn } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
import { Trans } from "@/i18n/client";

export function EventHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <header className={cn(className)}>{children}</header>;
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
        "text-balance font-semibold text-foreground text-xl leading-tight tracking-tight md:text-2xl",
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
