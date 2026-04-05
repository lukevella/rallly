"use client";

import { Button } from "@rallly/ui/button";
import { Card } from "@rallly/ui/card";
import { CalendarIcon, LockIcon } from "lucide-react";
import * as React from "react";
import { createBreakpoint } from "react-use";

import { AddToCalendarButton } from "@/components/add-to-calendar-button";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import DesktopPoll from "@/components/poll/desktop-poll";
import MobilePoll from "@/components/poll/mobile-poll";
import { usePoll } from "@/contexts/poll";
import { Trans } from "@/i18n/client";
import { dayjs } from "@/lib/dayjs";
import { useDayjs } from "@/utils/dayjs";

const useBreakpoint = createBreakpoint({ list: 320, table: 640 });

function ScheduledDateTime({
  start,
  duration,
  timeZone,
}: {
  start: Date;
  duration: number;
  timeZone: string | null;
}) {
  const { adjustTimeZone } = useDayjs();
  const adjusted = adjustTimeZone(start, !timeZone);
  const date = adjusted.format("dddd, LL");

  if (duration === 0) {
    return (
      <span className="flex flex-col items-center gap-0.5">
        <span>{date}</span>
        <span>
          <Trans i18nKey="allDay" />
        </span>
      </span>
    );
  }

  const endTime = adjustTimeZone(
    dayjs(start).add(duration, "minutes"),
    !timeZone,
  );
  const time = `${adjusted.format("LT")} - ${endTime.format(timeZone ? "LT z" : "LT")}`;

  return (
    <span className="flex flex-col items-center gap-0.5">
      <span className="text-foreground">{date}</span>
      <span>{time}</span>
    </span>
  );
}

export function ResponsiveResults() {
  const poll = usePoll();
  const breakpoint = useBreakpoint();
  const [dismissed, setDismissed] = React.useState(false);
  const PollComponent = breakpoint === "table" ? DesktopPoll : MobilePoll;

  if (!dismissed && poll.status === "scheduled" && poll.event) {
    return (
      <Card>
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
      </Card>
    );
  }

  if (!dismissed && poll.status === "closed") {
    return (
      <Card>
        <EmptyState>
          <EmptyStateIcon>
            <LockIcon />
          </EmptyStateIcon>
          <EmptyStateTitle>
            <Trans i18nKey="pollStatusClosed" defaults="Closed" />
          </EmptyStateTitle>
          <EmptyStateDescription>
            <Trans
              i18nKey="pollClosedDescription"
              defaults="No more responses are being accepted."
            />
          </EmptyStateDescription>
          <EmptyStateFooter>
            <Button onClick={() => setDismissed(true)}>
              <Trans i18nKey="viewResults" defaults="View results" />
            </Button>
          </EmptyStateFooter>
        </EmptyState>
      </Card>
    );
  }

  return <PollComponent />;
}
