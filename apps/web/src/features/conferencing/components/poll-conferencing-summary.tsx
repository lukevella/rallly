"use client";

import { ArrowUpRightIcon, VideoIcon } from "lucide-react";
import { ConferencingProviderIcon } from "@/features/conferencing/components/conferencing-provider-icon";
import type { PollConferencing } from "@/features/conferencing/schema";
import { conferencingProviderLabels } from "@/features/conferencing/utils";
import { Trans } from "@/i18n/client";

// What the organizer asked for, as shown on the poll page. A provider has no
// link until the poll is finalized and the meeting is minted; a pasted link
// is joinable from the start.
export function PollConferencingSummary({
  conferencing,
  meetingUri,
}: {
  conferencing: PollConferencing;
  meetingUri?: string | null;
}) {
  const joinUri =
    meetingUri ??
    (conferencing.provider === "custom" ? conferencing.uri : undefined);

  return (
    <>
      {conferencing.provider === "custom" ? (
        <>
          <VideoIcon />
          <span className="truncate">{conferencing.label}</span>
        </>
      ) : (
        <>
          <ConferencingProviderIcon
            provider={conferencing.provider}
            size={16}
          />
          <span>{conferencingProviderLabels[conferencing.provider]}</span>
        </>
      )}
      {joinUri ? (
        <>
          <span aria-hidden="true" className="text-muted-foreground">
            ·
          </span>
          <a
            href={joinUri}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 font-medium text-link"
          >
            <Trans i18nKey="joinMeeting" defaults="Join" />
            <ArrowUpRightIcon aria-hidden="true" className="text-current!" />
            <span className="sr-only">
              <Trans i18nKey="opensInNewTab" defaults="(opens in new tab)" />
            </span>
          </a>
        </>
      ) : null}
    </>
  );
}
