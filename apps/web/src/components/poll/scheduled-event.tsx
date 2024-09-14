"use client";

import { CalendarIcon } from "lucide-react";

import { AddToCalendarButton } from "@/components/add-to-calendar-button";
import { ParticipantAvatarBar } from "@/components/participant-avatar-bar";
import { useVisibleParticipants } from "@/components/participants-provider";
import { Trans } from "@/components/trans";
import { IfParticipantsVisible } from "@/components/visibility";
import { usePoll } from "@/contexts/poll";
import { useDayjs } from "@/utils/dayjs";

function FinalDate({ start }: { start: Date }) {
  const poll = usePoll();
  const { adjustTimeZone } = useDayjs();
  return (
    <span>{adjustTimeZone(start, !poll.timeZone).format("dddd, LL")}</span>
  );
}

function DateIcon({ start }: { start: Date }) {
  const poll = usePoll();
  const { adjustTimeZone } = useDayjs();
  const d = adjustTimeZone(start, !poll.timeZone);
  return (
    <time
      className="inline-flex size-12 flex-col rounded-lg border text-center"
      dateTime={d.toISOString()}
    >
      <div className="border-b border-green-600/10 p-px text-xs">
        {d.format("MMM")}
      </div>
      <div className="inline-flex grow items-center justify-center text-sm font-bold">
        {d.format("D")}
      </div>
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

function useAttendees() {
  const participants = useVisibleParticipants();
  const poll = usePoll();
  return participants.filter((participant) =>
    participant.votes.some(
      (vote) =>
        vote.optionId === poll?.event?.optionId &&
        (vote.type === "yes" || vote.type === "ifNeedBe"),
    ),
  );
}

function Attendees() {
  const attendees = useAttendees();

  return <ParticipantAvatarBar participants={attendees} max={5} />;
}

export function ScheduledEvent() {
  const poll = usePoll();
  const { event } = poll;

  const attendees = useAttendees();

  if (!event) {
    return null;
  }

  return (
    <>
      <div className="rounded-lg border bg-white p-0.5 shadow-sm">
        <div className="flex h-9 items-center gap-x-2 rounded-md bg-gray-100 px-2">
          <CalendarIcon className="size-4" />
          <h2 className="text-sm font-medium">
            <Trans i18nKey="schedulateDate" defaults="Scheduled Date" />
          </h2>
        </div>
        <div className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-6">
            <div>
              <DateIcon start={event.start} />
            </div>
            <div className="items-center gap-x-4">
              <div className="space-y-1">
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
              organizer={
                poll.user
                  ? { name: poll.user.name, email: poll.user.email }
                  : undefined
              }
              guests={attendees
                .filter((participant) => !!participant.email)
                .map((participant) => participant.email!)}
            />
          </div>
        </div>
      </div>
      <hr />
    </>
  );
}
