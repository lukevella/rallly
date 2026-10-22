"use client";

import {
  CalendarDaysIcon,
  ClockIcon,
  GlobeIcon,
  MapPinIcon,
} from "lucide-react";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
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
import { RelativeTime } from "@/lib/datetime/relative-time";

/**
 * The head of the Overview thread, written for the host like a pull
 * request's description: who created the poll and when, what it is about,
 * and the facts that tell it apart from similarly named polls. The title,
 * organizer and response legend are left to the participant's event card.
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
  const name = poll.user?.name;
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
    <div className="flex gap-3">
      <div className="shrink-0">
        <OptimizedAvatarImage
          size="lg"
          name={name ?? "?"}
          src={poll.user?.image ?? undefined}
        />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-card-border bg-card">
        <div className="flex flex-wrap items-baseline gap-x-1.5 border-card-border border-b bg-muted/50 px-4 py-2 text-sm">
          {name ? (
            <Trans
              i18nKey="pollDescriptionCardCreatedBy"
              defaults="<b>{name}</b> created this poll"
              values={{ name }}
              components={{ b: <b className="font-medium" /> }}
            />
          ) : (
            <Trans
              i18nKey="pollDescriptionCardCreated"
              defaults="Poll created"
            />
          )}
          <RelativeTime
            value={poll.createdAt}
            className="text-muted-foreground text-xs"
          />
        </div>
        <div className="space-y-3 px-4 py-3">
          {poll.description ? description : null}
          <EventMetaList>
            {first && last ? (
              <EventMetaItem>
                <CalendarDaysIcon />
                <span>
                  <Trans
                    i18nKey="pollDescriptionCardOptionCount"
                    defaults="{count, plural, one {# option} other {# options}}"
                    values={{ count: options.length }}
                  />
                  {" · "}
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
                  ) : null}
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
    </div>
  );
}
