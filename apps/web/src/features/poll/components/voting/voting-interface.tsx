"use client";
import { VotingBar } from "@/features/poll/components/voting/voting-bar";
import { VotingHeader } from "@/features/poll/components/voting/voting-header";
import { VotingOptions } from "@/features/poll/components/voting/voting-options";

/**
 * The participant voting interface: a header with the prompt and display
 * settings, the options table as the scroll area, and a footer with the
 * selection count and the response actions. Must render inside
 * `VotingForm`, in a column that gives it a bounded height.
 */
export function VotingInterface() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <VotingHeader />
      <VotingOptions />
      <VotingBar />
    </div>
  );
}
