"use client";

import {
  CalendarDaysIcon,
  ClockIcon,
  GlobeIcon,
  MapPinIcon,
} from "lucide-react";
import { PollConferencingSummary } from "@/features/conferencing/components/poll-conferencing-summary";
import { usePoll } from "@/features/poll/client";
import {
  EventMetaItem,
  EventMetaList,
} from "@/features/poll/components/event-meta";
import TruncatedLinkify from "@/features/poll/components/truncated-linkify";
import { EventDate } from "@/features/scheduled-event/components/event-date-time";
import { Trans } from "@/i18n/client";
import { Duration } from "@/lib/datetime/duration";

/**
 * The head of the Overview thread, written for the host like a pull
 * request's description: what the poll is about, the facts that tell it
 * apart from similarly named polls. Who created it is the thread's first item;
 * the host's actions are in the page header.
 */
export function PollDescriptionCard({
  description,
  options,
}: {
  description: React.ReactNode;
  /** The poll's options, earliest first. */
  options: { startTime: Date; duration: number }[];
}) {
  const poll = usePoll();
  const first = options[0];
  const last = options[options.length - 1];
  const allDay = options.every((option) => option.duration === 0);
  // One length for every option reads as the event's length; mixed lengths
  // say nothing useful in one line, so they are left out.
  const duration =
    first && options.every((option) => option.duration === first.duration)
      ? first.duration
      : null;

  return (
    <div className="overflow-hidden rounded-xl border border-card-border bg-card">
      <div className="space-y-3 px-4 py-3">
        <div className="space-y-1">
          <h2 className="font-semibold text-base">{poll.title}</h2>
          {poll.description ? description : null}
        </div>
        <EventMetaList>
          {first && last ? (
            <EventMetaItem>
              <CalendarDaysIcon />
              <span>
                <EventDate
                  value={first.startTime}
                  allDay={allDay}
                  timeZone={poll.timeZone}
                  preset="weekdayMonthDayShort"
                />
                {options.length > 1 ? (
                  <>
                    {" – "}
                    <EventDate
                      value={last.startTime}
                      allDay={allDay}
                      timeZone={poll.timeZone}
                      preset="weekdayMonthDayShort"
                    />
                  </>
                ) : null}{" "}
                <span className="text-muted-foreground">
                  <Trans
                    i18nKey="pollDescriptionCardOptionsInRange"
                    defaults="({count, plural, one {# option} other {# options}})"
                    values={{ count: options.length }}
                  />
                </span>
              </span>
            </EventMetaItem>
          ) : null}
          {allDay ? (
            <EventMetaItem>
              <ClockIcon />
              <Trans i18nKey="allDay" defaults="All day" />
            </EventMetaItem>
          ) : duration ? (
            <EventMetaItem>
              <ClockIcon />
              <Duration minutes={duration} />
            </EventMetaItem>
          ) : null}
          {poll.location ? (
            <EventMetaItem>
              <MapPinIcon />
              <TruncatedLinkify>{poll.location}</TruncatedLinkify>
            </EventMetaItem>
          ) : null}
          {poll.conferencing ? (
            <EventMetaItem>
              <PollConferencingSummary
                conferencing={poll.conferencing}
                meetingUri={poll.event?.conferencingUri}
              />
            </EventMetaItem>
          ) : null}
          {poll.timeZone && !allDay ? (
            <EventMetaItem>
              <GlobeIcon />
              {poll.timeZone}
            </EventMetaItem>
          ) : null}
        </EventMetaList>
      </div>
    </div>
  );
}
