import { loadPoll } from "@/features/poll/loaders";
import {
  ClosedPollStatusCard,
  OpenPollStatusCard,
  ScheduledPollStatusCard,
} from "./poll-status-card";

export default async function Page({
  params,
}: {
  params: Promise<{ pollId: string }>;
}) {
  const { pollId } = await params;
  const poll = await loadPoll(pollId);

  if (poll.status === "scheduled" && poll.scheduledEvent) {
    return (
      <ScheduledPollStatusCard
        eventId={poll.scheduledEvent.id}
        eventTitle={poll.scheduledEvent.title}
        start={poll.scheduledEvent.start}
        end={poll.scheduledEvent.end}
        allDay={poll.scheduledEvent.allDay}
        eventTimeZone={poll.scheduledEvent.timeZone}
      />
    );
  }

  if (poll.status === "open") {
    return (
      <OpenPollStatusCard
        pollId={poll.id}
        participantCount={poll.participantCount}
      />
    );
  }

  return (
    <ClosedPollStatusCard
      pollId={poll.id}
      closedReason={poll.closedReason}
      showReopen={poll.status === "closed"}
    />
  );
}
