"use client";
import Discussion from "@/components/discussion";
import { EventCard } from "@/components/event-card";
import { PollFooter } from "@/components/poll/poll-footer";
import { PollHeader } from "@/components/poll/poll-header";
import { ResponsiveResults } from "@/components/poll/responsive-results";
import { useTouchBeacon } from "@/components/poll/use-touch-beacon";
import { VotingForm } from "@/components/poll/voting-form";
import { ScheduledEvent } from "@/components/scheduled-event";

import { GuestPollAlert } from "./guest-poll-alert";

export function AdminPage() {
  useTouchBeacon();
  return (
    <div className="space-y-3 lg:space-y-4">
      <PollHeader />
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
