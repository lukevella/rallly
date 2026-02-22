"use client";
import Discussion from "@/components/discussion";
import { EventCard } from "@/components/event-card";
import { PollFooter } from "@/components/poll/poll-footer";
import { PollViewTracker } from "@/components/poll/poll-view-tracker";
import { ResponsiveResults } from "@/components/poll/responsive-results";
import { ScheduledEvent } from "@/components/poll/scheduled-event";
import { VotingForm } from "@/components/poll/voting-form";
import { usePoll } from "@/contexts/poll";

import { GuestPollAlert } from "./guest-poll-alert";
import { UnsubscribeAlert } from "./unsubscribe-alert";

export function AdminPage() {
  // Get the poll ID from the context
  const poll = usePoll();

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Track poll views */}
      <PollViewTracker pollId={poll.id} />
      <UnsubscribeAlert />
      <GuestPollAlert />
      <EventCard />
      <ScheduledEvent />
      <VotingForm>
        <ResponsiveResults />
      </VotingForm>
      <Discussion />
      <PollFooter />
    </div>
  );
}
