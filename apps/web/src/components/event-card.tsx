"use client";
import { Card, CardContent, CardTitle } from "@rallly/ui/card";
import { Icon } from "@rallly/ui/icon";
import { CalendarIcon, ClockIcon, MapPinIcon } from "lucide-react";

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
    <span>{`${adjustTimeZone(start).format("LT")} - ${adjustTimeZone(dayjs(start).add(duration, "minutes"), !poll.timeZone).format("LT")}`}</span>
  );
}

export function EventCard() {
  const poll = usePoll();
  return (
    <Card>
      <RandomGradientBar seed={poll.id} />
      <CardContent>
        <div className="mb-4 flex gap-4">
          <div className="space-y-2">
            <CardTitle className="text-lg">{poll.title}</CardTitle>
            <ul className="text-muted-foreground flex flex-col flex-wrap gap-x-4 gap-y-2 whitespace-nowrap text-sm lg:flex-row">
              {poll.location ? (
                <li className="flex items-center gap-x-2.5">
                  <Icon>
                    <MapPinIcon />
                  </Icon>
                  <TruncatedLinkify>{poll.location}</TruncatedLinkify>
                </li>
              ) : null}
              {poll.event ? (
                <>
                  <li className="flex items-center gap-x-2.5">
                    <Icon>
                      <CalendarIcon />
                    </Icon>
                    <FinalDate start={poll.event.start} />
                  </li>
                  <li className="flex items-center gap-x-2.5">
                    <Icon>
                      <ClockIcon />
                    </Icon>
                    <FinalTime
                      start={poll.event.start}
                      duration={poll.event.duration}
                    />
                  </li>
                </>
              ) : (
                <li className="flex items-center gap-x-2.5">
                  <Icon>
                    <CalendarIcon />
                  </Icon>
                  <Trans i18nKey="tba" defaults="To be announced" />
                </li>
              )}
            </ul>
          </div>
        </div>
        {poll.description ? (
          <p className="mb-4 text-sm">
            <TruncatedLinkify>{poll.description}</TruncatedLinkify>
          </p>
        ) : null}
        <PollSubheader />
      </CardContent>
    </Card>
  );
}
