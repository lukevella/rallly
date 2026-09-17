"use client";
import { VotingBar } from "@/features/poll/components/voting/voting-bar";
import { VotingHeader } from "@/features/poll/components/voting/voting-header";
import { VotingOptions } from "@/features/poll/components/voting/voting-options";

/**
 * The participant voting interface: a sticky header with the prompt and
 * display settings, the options, and a sticky footer with the selection
 * count and the response actions. Must render inside `VotingForm`, in a
 * scroll container.
 */
export function VotingInterface() {
  return (
    <div className="flex min-h-full flex-col">
      <VotingHeader />
      <VotingOptions />
      <VotingBar />
    </div>
  );
}
