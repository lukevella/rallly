"use client";
import { Card, CardContent, CardFooter, CardTitle } from "@rallly/ui/card";
import { Icon } from "@rallly/ui/icon";
import { CalendarIcon, ClockIcon, MapPinIcon, TextIcon } from "lucide-react";

import PollSubheader from "@/components/poll/poll-subheader";
import TruncatedLinkify from "@/components/poll/truncated-linkify";
import { RandomGradientBar } from "@/components/random-gradient-bar";
import { Trans } from "@/components/trans";
import { usePoll } from "@/contexts/poll";
import { useDayjs } from "@/utils/dayjs";

function FinalDate({ start }: { start: Date }) {
  const poll = usePoll();
  const { adjustTimeZone } = useDayjs();
  return <span>{adjustTimeZone(start, !poll.timeZone).format("LL")}</span>;
}

function FinalTime({ start, duration }: { start: Date; duration: number }) {
  const poll = usePoll();
  const { adjustTimeZone, dayjs } = useDayjs();
  return (
    <span>{`${adjustTimeZone(start, !poll.timeZone).format("LT")} - ${adjustTimeZone(dayjs(start).add(duration, "minutes"), !poll.timeZone).format("LT")}`}</span>
  );
}

export function EventCard() {
  const poll = usePoll();
  return (
    <Card>
      <RandomGradientBar seed={poll.id} />
      <CardContent>
        <CardTitle className="mb-4 text-lg leading-tight">
          {poll.title}
        </CardTitle>
        <ul className="text-muted-foreground flex flex-col gap-x-4 gap-y-2.5 whitespace-nowrap text-sm">
          {poll.event ? (
            <>
              <li className="flex items-center gap-x-2.5">
                <Icon>
                  <CalendarIcon />
                </Icon>
                <FinalDate start={poll.event.start} />
              </li>
              {poll.event.duration > 0 ? (
                <li className="flex items-center gap-x-2.5">
                  <Icon>
                    <ClockIcon />
                  </Icon>
                  <FinalTime
                    start={poll.event.start}
                    duration={poll.event.duration}
                  />
                </li>
              ) : null}
            </>
          ) : (
            <li className="flex items-center gap-x-2.5">
              <Icon>
                <CalendarIcon />
              </Icon>
              <Trans i18nKey="tba" defaults="To be announced" />
            </li>
          )}
          {poll.location ? (
            <li className="flex items-center gap-x-2.5">
              <Icon>
                <MapPinIcon />
              </Icon>
              <TruncatedLinkify>{poll.location}</TruncatedLinkify>
            </li>
          ) : null}

          {poll.description ? (
            <li className="flex items-start gap-x-2.5">
              <Icon>
                <TextIcon className="translate-y-0.5" />
              </Icon>
              <p className="text-foreground min-w-0 text-wrap text-sm">
                <TruncatedLinkify>{poll.description}</TruncatedLinkify>
              </p>
            </li>
          ) : null}
        </ul>
      </CardContent>
      <CardFooter>
        <PollSubheader />
      </CardFooter>
    </Card>
  );
}
