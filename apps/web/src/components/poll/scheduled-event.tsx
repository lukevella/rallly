"use client";

import { CalendarCheckIcon } from "lucide-react";

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
  return (
    <time
      className="inline-flex size-10 flex-col items-center justify-center text-green-800"
      dateTime={d.toISOString()}
    >
      <div className="text-xs uppercase opacity-75">{d.format("ddd")}</div>
      <div className="text-base font-bold">{d.format("D")}</div>
    </time>
  );
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
    <div className="rounded-lg border border-green-400/20 bg-gradient-to-r from-green-200/15 p-0.5 shadow-sm">
      <div className="flex items-center gap-x-2 rounded-md border-b bg-green-500/10 p-3">
        <h2 className="text-sm font-medium text-green-700">
          <Trans i18nKey="schedulateDate" defaults="Scheduled Date" />
        </h2>
      </div>
      <div className="flex justify-between p-4">
        <div className="flex gap-4">
          <DateIcon start={event.start} />
          <div className="items-center gap-x-4 text-green-700">
            <div>
              <div className="text-sm font-medium">
                <FinalDate start={event.start} />
              </div>
              <div className="text-sm opacity-75">
                <FinalTime start={event.start} duration={event.duration} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <IfParticipantsVisible>
            <Attendees />
          </IfParticipantsVisible>
          <AddToCalendarButton
            title={poll.title}
            description={poll.description ?? undefined}
            start={event.start}
            duration={event.duration}
            location={poll.location ?? undefined}
          />
        </div>
      </div>
    </div>
  );
}
