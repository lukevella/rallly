"use client";
import { Button } from "@rallly/ui/button";
import { CalendarIcon, LockIcon } from "lucide-react";
import * as React from "react";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { AddToCalendarButton } from "@/features/calendars/components/add-to-calendar-button";
import type { VotePageView } from "@/features/poll/vote/types";
import {
  EventDate,
  EventTimeRange,
} from "@/features/scheduled-event/components/event-date-time";
import { Trans } from "@/i18n/client";

/**
 * Stands in for the panel while a poll is scheduled or closed, until the
 * viewer asks to see the results.
 */
export function VoteOutcome({
  poll,
  children,
}: {
  poll: VotePageView["poll"];
  children: React.ReactNode;
}) {
  const [dismissed, setDismissed] = React.useState(false);

  if (!dismissed && poll.status === "scheduled" && poll.event) {
    const allDay = poll.event.duration === 0;
    return (
      <EmptyState className="flex-1">
        <EmptyStateIcon>
          <CalendarIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>
          <Trans i18nKey="pollStatusScheduled" defaults="Scheduled" />
        </EmptyStateTitle>
        <EmptyStateDescription>
          <span className="flex flex-col items-center gap-0.5">
            <EventDate
              value={poll.event.start}
              allDay={allDay}
              timeZone={poll.timeZone}
              preset="dateFull"
              className={allDay ? undefined : "text-foreground"}
            />
            <EventTimeRange
              start={poll.event.start}
              end={
                new Date(
                  poll.event.start.getTime() + poll.event.duration * 60_000,
                )
              }
              allDay={allDay}
              timeZone={poll.timeZone}
              showTimeZone
            />
          </span>
        </EmptyStateDescription>
        <EmptyStateFooter className="flex flex-wrap items-center justify-center gap-2">
          <AddToCalendarButton eventId={poll.event.id} />
          <Button onClick={() => setDismissed(true)}>
            <Trans i18nKey="viewResults" defaults="View results" />
          </Button>
        </EmptyStateFooter>
      </EmptyState>
    );
  }

  if (!dismissed && poll.status === "closed") {
    return (
      <EmptyState className="flex-1">
        <EmptyStateIcon>
          <LockIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>
          <Trans i18nKey="pollStatusClosed" defaults="Closed" />
        </EmptyStateTitle>
        <EmptyStateDescription>
          {poll.closedReason === "auto" ? (
            <Trans
              i18nKey="pollAutoClosedDescription"
              defaults="This poll was closed automatically because all of its dates have passed. No more responses are being accepted."
            />
          ) : (
            <Trans
              i18nKey="pollClosedDescription"
              defaults="No more responses are being accepted."
            />
          )}
        </EmptyStateDescription>
        <EmptyStateFooter>
          <Button onClick={() => setDismissed(true)}>
            <Trans i18nKey="viewResults" defaults="View results" />
          </Button>
        </EmptyStateFooter>
      </EmptyState>
    );
  }

  return children;
}
