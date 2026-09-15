"use client";
import { useInstancePolicy } from "@/features/instance-policy/client";
import { usePoll } from "@/features/poll/client";
import { CommentsSheet } from "@/features/poll/components/comments-sheet";
import { EventCard } from "@/features/poll/components/event-card";
import { PollFooter } from "@/features/poll/components/poll-footer";
import { ResponsiveResults } from "@/features/poll/components/responsive-results";
import { VotingForm } from "@/features/poll/components/voting-form";
import { RemoveAttributionPopover } from "@/features/space/components/remove-attribution-popover";
import { GuestPollAlert } from "./guest-poll-alert";

export function AdminPage({
  footerLinks,
  manageableSpace,
}: {
  footerLinks: { label: string; href: string }[];
  manageableSpace: { id: string } | null;
}) {
  const poll = usePoll();
  const { spaceAttributionConfigurable } = useInstancePolicy();

  const canRemoveAttribution =
    spaceAttributionConfigurable &&
    manageableSpace !== null &&
    manageableSpace.id === poll.spaceId;

  return (
    <div className="space-y-3 lg:space-y-4">
      <GuestPollAlert />
      <EventCard />
      <VotingForm>
        <ResponsiveResults />
      </VotingForm>
      <div className="fixed right-4 bottom-15 z-40 lg:right-6 lg:bottom-6">
        <CommentsSheet className="rounded-full shadow-lg" />
      </div>
      <PollFooter
        footerLinks={footerLinks}
        attributionAction={
          canRemoveAttribution ? (
            <RemoveAttributionPopover pollId={poll.id} />
          ) : undefined
        }
      />
      <div className="h-24 lg:hidden" />
    </div>
  );
}
