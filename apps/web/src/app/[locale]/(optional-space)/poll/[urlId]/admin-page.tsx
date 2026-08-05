"use client";
import { CommentsSheet } from "@/features/poll/components/comments-sheet";
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
      <div className="fixed right-4 bottom-4 z-40 lg:right-6 lg:bottom-6">
        <CommentsSheet className="rounded-full shadow-lg" />
      </div>
      <PollFooter />
      <div className="h-12 lg:hidden" />
    </div>
  );
}
