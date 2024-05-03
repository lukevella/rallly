"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@rallly/ui/card";
import { Icon } from "@rallly/ui/icon";
import dayjs from "dayjs";
import { DotIcon, MapPinIcon } from "lucide-react";

import { DateIconInner } from "@/components/date-icon";
import { ParticipantAvatarBar } from "@/components/participant-avatar-bar";
import { useParticipants } from "@/components/participants-provider";
import TruncatedLinkify from "@/components/poll/truncated-linkify";
import { PollStatusBadge } from "@/components/poll-status";
import { RandomGradientBar } from "@/components/random-gradient-bar";
import { Trans } from "@/components/trans";
import { usePoll } from "@/contexts/poll";
import { useDayjs } from "@/utils/dayjs";

function FinalDate({ start }: { start: Date }) {
  const poll = usePoll();
  const { adjustTimeZone } = useDayjs();
  return <span>{adjustTimeZone(start, !poll.timeZone).format("LL")}</span>;
}

function DateIcon({ start }: { start: Date }) {
  const poll = usePoll();
  const { adjustTimeZone } = useDayjs();
  const d = adjustTimeZone(start, !poll.timeZone);
  return <DateIconInner dow={d.format("ddd")} day={d.format("D")} />;
}

function FinalTime({ start, duration }: { start: Date; duration: number }) {
  const poll = usePoll();
  const { adjustTimeZone, dayjs } = useDayjs();
  return (
    <span>{`${adjustTimeZone(start, !poll.timeZone).format("LT")} - ${adjustTimeZone(dayjs(start).add(duration, "minutes"), !poll.timeZone).format("LT")}`}</span>
  );
}

function Attendees() {
  const { participants } = useParticipants();
  const poll = usePoll();
  const attendees = participants.filter((participant) =>
    participant.votes.some(
      (vote) =>
        vote.optionId === poll?.event?.optionId &&
        (vote.type === "yes" || vote.type === "ifNeedBe"),
    ),
  );

  return <ParticipantAvatarBar participants={attendees} max={5} />;
}

export function EventCard() {
  const poll = usePoll();
  return (
    <Card>
      <RandomGradientBar seed={poll.id} />
      <CardContent className="bg-gray-50">
        <div className="mb-4 flex flex-col items-start gap-4 lg:flex-row lg:justify-between">
          <div>
            <CardTitle className="text-lg">{poll.title}</CardTitle>
            <CardDescription>
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <span>
                  <Trans
                    i18nKey="createdBy"
                    values={{
                      name: poll.user?.name ?? t("guest"),
                    }}
                    components={{
                      b: <span />,
                    }}
                  />
                </span>
                <Icon>
                  <DotIcon />
                </Icon>
                <span className="whitespace-nowrap">
                  <Trans
                    i18nKey="createdTime"
                    values={{ relativeTime: dayjs(poll.createdAt).fromNow() }}
                  />
                </span>
              </span>
            </CardDescription>
          </div>
          <PollStatusBadge status={poll.status} />
        </div>
        {poll.description ? (
          <p className="mb-4 min-w-0 text-wrap text-sm leading-relaxed">
            <TruncatedLinkify>{poll.description}</TruncatedLinkify>
          </p>
        ) : null}
        <ul className="text-muted-foreground flex flex-col gap-x-4 gap-y-2.5 whitespace-nowrap text-sm">
          {poll.location ? (
            <li className="flex items-center gap-x-2.5">
              <Icon>
                <MapPinIcon />
              </Icon>
              <TruncatedLinkify>{poll.location}</TruncatedLinkify>
            </li>
          ) : null}
        </ul>
      </CardContent>
      {poll.event ? (
        <CardFooter className="flex justify-between gap-4">
          <div className="flex items-center gap-x-4">
            <DateIcon start={poll.event.start} />
            <div>
              <div className="text-sm font-medium">
                <FinalDate start={poll.event.start} />
              </div>
              <div className="text-muted-foreground text-sm">
                <FinalTime
                  start={poll.event.start}
                  duration={poll.event.duration}
                />
              </div>
            </div>
          </div>
          <div>
            <Attendees />
          </div>
        </CardFooter>
      ) : null}
    </Card>
  );
}
