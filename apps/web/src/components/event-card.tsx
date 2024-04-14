"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@rallly/ui/card";
import { Icon } from "@rallly/ui/icon";
import {
  CalendarIcon,
  CalendarSearchIcon,
  ClockIcon,
  MapPinIcon,
} from "lucide-react";

import { TimesShownIn } from "@/components/clock";
import { DateIcon } from "@/components/date-icon";
import PollSubheader from "@/components/poll/poll-subheader";
import TruncatedLinkify from "@/components/poll/truncated-linkify";
import { RandomGradientBar } from "@/components/random-gradient-bar";
import { Trans } from "@/components/trans";
import { usePoll } from "@/contexts/poll";
import { useDayjs } from "@/utils/dayjs";

function When() {
  const poll = usePoll();
  const { adjustTimeZone, dayjs } = useDayjs();
  if (poll.event) {
    return (
      <ul className="space-y-1.5">
        <li className="flex items-center gap-x-2.5">
          <Icon>
            <CalendarIcon />
          </Icon>
          {adjustTimeZone(poll.event.start, !poll.timeZone).format("LL")}
        </li>
        {poll.event.duration > 0 ? (
          <li className="flex items-center gap-x-2.5">
            <Icon>
              <ClockIcon />
            </Icon>
            <span>{`${adjustTimeZone(poll.event.start).format("LT")} - ${adjustTimeZone(dayjs(poll.event.start).add(poll.event.duration, "minutes"), !poll.timeZone).format("LT")}`}</span>
          </li>
        ) : null}
      </ul>
    );
  }

  return (
    <div className="flex items-center gap-x-2.5">
      <Icon>
        <CalendarIcon />
      </Icon>
      <Trans i18nKey="tba" defaults="To be announced" />
    </div>
  );
}

function EventIcon() {
  const poll = usePoll();
  const { adjustTimeZone } = useDayjs();

  return poll.event ? (
    <DateIcon date={adjustTimeZone(poll.event.start)} />
  ) : (
    <div className="relative inline-flex size-12 items-center justify-center rounded-lg border border-gray-300 bg-gray-200">
      <Icon>
        <CalendarSearchIcon />
      </Icon>
    </div>
  );
}

export function EventCard() {
  const poll = usePoll();
  return (
    <Card>
      <RandomGradientBar seed={poll.id} />
      <CardHeader>
        <div className="flex gap-4">
          <div>
            <EventIcon />
          </div>
          <div className="space-y-2.5">
            <CardTitle className="text-lg">{poll.title}</CardTitle>
            <ul className="text-muted-foreground mt-1.5 space-y-2 text-sm">
              <li>
                <When />
              </li>
              {poll.timeZone ? (
                <li>
                  <TimesShownIn />
                </li>
              ) : null}
              {poll.location ? (
                <li className="flex items-center gap-x-2.5">
                  <Icon>
                    <MapPinIcon />
                  </Icon>
                  <TruncatedLinkify>{poll.location}</TruncatedLinkify>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {poll.description ? (
          <p className="text-sm">
            <TruncatedLinkify>{poll.description}</TruncatedLinkify>
          </p>
        ) : null}
        <PollSubheader />
      </CardContent>
    </Card>
  );
}
