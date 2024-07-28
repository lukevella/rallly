"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";

import { AddToCalendarButton } from "@/components/add-to-calendar-button";
import { DateIconInner } from "@/components/date-icon";
import { ParticipantAvatarBar } from "@/components/participant-avatar-bar";
import { useParticipants } from "@/components/participants-provider";
import { Trans } from "@/components/trans";
import { IfParticipantsVisible } from "@/components/visibility";
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
  if (duration === 0) {
    return <Trans i18nKey="allDay" />;
  }
  return (
    <span>{`${adjustTimeZone(start, !poll.timeZone).format("LT")} - ${adjustTimeZone(dayjs(start).add(duration, "minutes"), !poll.timeZone).format(poll.timeZone ? "LT z" : "LT")}`}</span>
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

export function ScheduledEvent() {
  const poll = usePoll();
  const { event } = poll;
  if (!event) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduled</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between gap-4">
          <div className="flex items-center gap-x-4">
            <DateIcon start={event.start} />
            <div>
              <div className="text-sm font-medium">
                <FinalDate start={event.start} />
              </div>
              <div className="text-muted-foreground text-sm">
                <FinalTime start={event.start} duration={event.duration} />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center gap-4">
        <AddToCalendarButton
          title={poll.title}
          description={poll.description ?? undefined}
          start={event.start}
          duration={event.duration}
          location={poll.location ?? undefined}
        />
        <IfParticipantsVisible>
          <Attendees />
        </IfParticipantsVisible>
      </CardFooter>
    </Card>
  );
}
