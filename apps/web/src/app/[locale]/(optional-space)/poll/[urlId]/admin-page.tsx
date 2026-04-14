"use client";
import Discussion from "@/components/discussion";
import { EventCard } from "@/components/event-card";
import { PollBranding } from "@/components/poll/poll-branding";
import { PollFooter } from "@/components/poll/poll-footer";
import { ResponsiveResults } from "@/components/poll/responsive-results";
import { VotingForm } from "@/components/poll/voting-form";
import { usePoll } from "@/contexts/poll";
import { GuestPollAlert } from "./guest-poll-alert";

export function AdminPage() {
  // Get the poll ID from the context
  const poll = usePoll();

  return (
    <div className="space-y-3 lg:space-y-4">
      {poll.space?.showBranding && poll.space.primaryColor ? (
        <PollBranding primaryColor={poll.space.primaryColor} />
      ) : null}
      <GuestPollAlert />
      <EventCard />
      <VotingForm>
        <ResponsiveResults />
      </VotingForm>
      <Discussion />
      <PollFooter />
    </div>
  );
}
