"use client";

import { VideoIcon } from "lucide-react";
import { ConferencingProviderIcon } from "@/features/conferencing/components/conferencing-provider-icon";
import type { PollConferencing } from "@/features/conferencing/schema";
import { conferencingProviderLabels } from "@/features/conferencing/utils";

// What the organizer asked for, as shown on the poll page. A provider has no
// link until the poll is finalized, so it shows as the service name; a
// pasted link is already joinable.
export function PollConferencingSummary({
  conferencing,
}: {
  conferencing: PollConferencing;
}) {
  if (conferencing.provider === "custom") {
    return (
      <>
        <VideoIcon />
        <a
          href={conferencing.uri}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate underline hover:text-foreground"
        >
          {conferencing.label}
        </a>
      </>
    );
  }

  return (
    <>
      <ConferencingProviderIcon provider={conferencing.provider} size={16} />
      <span>{conferencingProviderLabels[conferencing.provider]}</span>
    </>
  );
}
