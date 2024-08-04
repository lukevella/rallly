"use client";

import { InfoCard } from "@rallly/ui/info-card";

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
  return <span>{adjustTimeZone(start, !poll.timeZone).format("LL")}</span>;
}

function DateIcon({ start }: { start: Date }) {
  const poll = usePoll();
  const { adjustTimeZone } = useDayjs();
  const d = adjustTimeZone(start, !poll.timeZone);
  return (
    <time
      className="inline-flex size-12 flex-col rounded-lg border bg-white text-center text-gray-800/75 shadow-sm"
      dateTime={d.toISOString()}
    >
      <div className="border-b border-gray-600/10 p-px text-xs">
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

function CalendarEvent() {
  const poll = usePoll();
  const { event } = poll;

  const attendees = useAttendees();

  if (!event) {
    return null;
  }

  return (
    <div className="flex flex-col justify-between gap-4">
      <div className="flex items-center gap-6">
        <div className="inline-flex items-center justify-center">
          <DateIcon start={event.start} />
        </div>
        <div className="items-center gap-x-4 text-gray-800">
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
      <div className="flex items-center gap-4 text-gray-800">
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
  );
}

function InProgressEvent() {
  return (
    <div className="flex items-center justify-center text-sm text-gray-800">
      To be announced
    </div>
  );
}

export function ScheduledEvent() {
  const poll = usePoll();
  const { event } = poll;

  return (
    <InfoCard
      color={event ? "green" : "gray"}
      title={<Trans i18nKey="when" defaults="When" />}
    >
      {event ? <CalendarEvent /> : <InProgressEvent />}
    </InfoCard>
  );
}
