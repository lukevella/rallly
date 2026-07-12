"use client";
import Discussion from "@/features/poll/components/discussion";
import { EventCard } from "@/features/poll/components/event-card";
import { PollFooter } from "@/features/poll/components/poll-footer";
import { ResponsiveResults } from "@/features/poll/components/responsive-results";
import { VotingForm } from "@/features/poll/components/voting-form";
import { GuestPollAlert } from "./guest-poll-alert";

export function AdminPage() {
  return (
    <div className="space-y-3 lg:space-y-4">
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
