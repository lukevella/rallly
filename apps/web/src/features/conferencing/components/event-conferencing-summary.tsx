"use client";

import { PhoneIcon } from "lucide-react";
import { PollConferencingSummary } from "@/features/conferencing/components/poll-conferencing-summary";
import type { Conferencing } from "@/features/conferencing/schema";
import { getConferencingUri } from "@/features/conferencing/utils";

// The meeting a scheduled event carries. A canceled event keeps its provider
// but drops the join link: the meeting may no longer exist.
export function EventConferencingSummary({
  conferencing,
  joinable = true,
}: {
  conferencing: Conferencing;
  joinable?: boolean;
}) {
  if (conferencing.provider === "phone") {
    return (
      <>
        <PhoneIcon />
        {joinable ? (
          <a href={getConferencingUri(conferencing)} className="text-link">
            {conferencing.number}
          </a>
        ) : (
          <span>{conferencing.number}</span>
        )}
      </>
    );
  }

  const joinUri = joinable ? conferencing.uri : null;

  if (conferencing.provider === "custom") {
    return (
      <PollConferencingSummary
        conferencing={{
          provider: "custom",
          label: conferencing.label,
          uri: joinUri ?? undefined,
        }}
      />
    );
  }

  return (
    <PollConferencingSummary
      conferencing={{ provider: conferencing.provider }}
      meetingUri={joinUri}
    />
  );
}
