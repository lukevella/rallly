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
import { usePoll } from "@/features/poll/client";
import {
  EventDate,
  EventTimeRange,
} from "@/features/scheduled-event/components/event-date-time";
import { Trans } from "@/i18n/client";

function ScheduledDateTime({
  start,
  duration,
  timeZone,
}: {
  start: Date;
  duration: number;
  timeZone: string | null;
}) {
  const allDay = duration === 0;

  return (
    <span className="flex flex-col items-center gap-0.5">
      <EventDate
        value={start}
        allDay={allDay}
        timeZone={timeZone}
        preset="dateFull"
        className={allDay ? undefined : "text-foreground"}
      />
      <EventTimeRange
        start={start}
        end={new Date(start.getTime() + duration * 60_000)}
        allDay={allDay}
        timeZone={timeZone}
        showTimeZone
      />
    </span>
  );
}

/**
 * Stands in for the voting interface while a poll is scheduled or closed,
 * until the viewer asks to see the results. Renders its children otherwise.
 * `frame` wraps the notice when the surrounding layout gives the children
 * their own container (the legacy stacked pages wrap it in a card).
 */
export function PollOutcome({
  children,
  frame: Frame = React.Fragment,
}: {
  children: React.ReactNode;
  frame?: React.ElementType;
}) {
  const poll = usePoll();
  const [dismissed, setDismissed] = React.useState(false);

  if (!dismissed && poll.status === "scheduled" && poll.event) {
    return (
      <Frame>
        <EmptyState>
          <EmptyStateIcon>
            <CalendarIcon />
          </EmptyStateIcon>
          <EmptyStateTitle>
            <Trans i18nKey="pollStatusScheduled" defaults="Scheduled" />
          </EmptyStateTitle>
          <EmptyStateDescription>
            <ScheduledDateTime
              start={poll.event.start}
              duration={poll.event.duration}
              timeZone={poll.timeZone}
            />
          </EmptyStateDescription>
          <EmptyStateFooter className="flex flex-wrap items-center justify-center gap-2">
            <AddToCalendarButton eventId={poll.event.id} />
            <Button onClick={() => setDismissed(true)}>
              <Trans i18nKey="viewResults" defaults="View results" />
            </Button>
          </EmptyStateFooter>
        </EmptyState>
      </Frame>
    );
  }

  if (!dismissed && poll.status === "closed") {
    return (
      <Frame>
        <EmptyState>
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
      </Frame>
    );
  }

  return children;
}
