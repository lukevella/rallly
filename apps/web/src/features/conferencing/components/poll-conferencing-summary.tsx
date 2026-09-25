"use client";

import { ArrowUpRightIcon, VideoIcon } from "lucide-react";
import { ConferencingProviderIcon } from "@/features/conferencing/components/conferencing-provider-icon";
import type { PollConferencing } from "@/features/conferencing/schema";
import {
  conferencingProviderLabels,
  getLinkHost,
} from "@/features/conferencing/utils";
import { Trans } from "@/i18n/client";

// What the organizer asked for, as shown on the poll page. A provider has no
// link until the poll is finalized, so it shows as the service name; a
// pasted link is already joinable.
export function PollConferencingSummary({
  conferencing,
}: {
  conferencing: PollConferencing;
}) {
  if (conferencing.provider === "custom") {
    const host = getLinkHost(conferencing.uri);
    const showHost = host && host !== conferencing.label.toLowerCase();
    return (
      <>
        <VideoIcon />
        <a
          href={conferencing.uri}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex min-w-0 items-center gap-1 hover:text-foreground"
        >
          <span className="truncate">{conferencing.label}</span>
          {showHost ? (
            <span className="truncate text-muted-foreground">{host}</span>
          ) : null}
          <ArrowUpRightIcon className="transition-colors group-hover:text-foreground" />
          <span className="sr-only">
            <Trans i18nKey="opensInNewTab" defaults="(opens in new tab)" />
          </span>
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
