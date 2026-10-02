"use client";
import { cn } from "@rallly/ui";
import { CommentsSheet } from "@/features/poll/components/comments-sheet";
import { useVotingForm } from "@/features/poll/components/voting-form";

/**
 * Comments pill pinned to the viewport corner. Must render inside
 * `VotingForm`. While a response is being edited the list's sticky footer
 * occupies the bottom edge, so the pill lifts clear of it: below `sm` on the
 * legacy page, where the grid takes over above that, and at every width on
 * the vote page, where the list is the only interface.
 */
export function FloatingComments({
  liftAtAllWidths = false,
}: {
  liftAtAllWidths?: boolean;
}) {
  const votingForm = useVotingForm();
  const isVoting = votingForm.watch("mode") !== "view";

  return (
    <div
      className={cn(
        "fixed right-4 z-40 m-0 transition-[bottom] duration-300 ease-out lg:right-6",
        isVoting
          ? liftAtAllWidths
            ? "bottom-20"
            : "bottom-20 sm:bottom-4 lg:bottom-6"
          : "bottom-4 lg:bottom-6",
      )}
    >
      <CommentsSheet className="rounded-full shadow-lg" />
    </div>
  );
}
