"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
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
      <div className="space-y-1.5">
        <div className="flex items-center gap-x-2.5">
          <Icon>
            <CalendarIcon />
          </Icon>
          {adjustTimeZone(poll.event.start, !poll.timeZone).format("LL")}
        </div>
        {poll.event.duration > 0 ? (
          <div className="flex items-center gap-x-2.5">
            <Icon>
              <ClockIcon />
            </Icon>
            <span>{`${adjustTimeZone(poll.event.start).format("LT")} - ${adjustTimeZone(dayjs(poll.event.start).add(poll.event.duration, "minutes"), !poll.timeZone).format("LT")}`}</span>
          </div>
        ) : null}
        {poll.timeZone ? <TimesShownIn /> : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-x-2.5">
      <Icon>
        <CalendarSearchIcon />
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
        <div className="flex items-start gap-x-4 gap-y-2.5">
          <div className="shrink-0">
            <EventIcon />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-lg">{poll.title}</CardTitle>
            {poll.location ? (
              <CardDescription className="flex items-center gap-x-2.5">
                <Icon>
                  <MapPinIcon />
                </Icon>
                <TruncatedLinkify>{poll.location}</TruncatedLinkify>
              </CardDescription>
            ) : null}
            <CardDescription>
              <When />
            </CardDescription>
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
