"use client";

import { Card, CardContent } from "@rallly/ui/card";

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
  if (!poll.event) {
    return null;
  }
  return (
    <Card className="bg-gray-50">
      <CardContent>
        <div className="flex justify-between gap-4">
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
            <IfParticipantsVisible>
              <Attendees />
            </IfParticipantsVisible>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
