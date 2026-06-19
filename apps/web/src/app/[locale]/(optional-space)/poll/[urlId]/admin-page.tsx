"use client";
import Discussion from "@/components/discussion";
import { EventCard } from "@/components/event-card";
import { PollFooter } from "@/components/poll/poll-footer";
import { ResponsiveResults } from "@/components/poll/responsive-results";
import { VotingForm } from "@/components/poll/voting-form";
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
