"use client";

import { cn } from "@rallly/ui";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { PollConferencingSummary } from "@/features/conferencing/components/poll-conferencing-summary";
import { usePoll } from "@/features/poll/client";
import TruncatedLinkify from "@/features/poll/components/truncated-linkify";
import VoteIcon from "@/features/poll/components/vote-icon";
import { Trans } from "@/i18n/client";

function DetailItem({
  label,
  children,
  className,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="mt-1 text-pretty text-sm">{children}</dd>
    </div>
  );
}

/** The poll's title and description. */
export function EventTitle({
  description,
  action,
  className,
}: {
  description: React.ReactNode;
  /** Sits to the right of the title, top aligned. */
  action?: React.ReactNode;
  className?: string;
}) {
  const poll = usePoll();
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-start justify-between gap-2">
        <h1 className="min-w-0 text-balance font-semibold text-xl tracking-tight">
          {poll.title}
        </h1>
        {action}
      </div>
      {description}
    </div>
  );
}

/**
 * The poll's details as labelled pairs, like a blog post's sidebar: two
 * columns below lg, one stacked column in the sidebar from lg up.
 */
export function EventDetailsList({ className }: { className?: string }) {
  const poll = usePoll();
  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-1",
        className,
      )}
    >
      {poll.user ? (
        <DetailItem
          label={<Trans i18nKey="eventHeaderOrganizer" defaults="Organizer" />}
        >
          <span className="flex items-center gap-1.5">
            <OptimizedAvatarImage
              size="sm"
              src={poll.user.image ?? undefined}
              name={poll.user.name}
            />
            <span className="truncate">{poll.user.name}</span>
          </span>
        </DetailItem>
      ) : null}
      {poll.location ? (
        <DetailItem
          label={<Trans i18nKey="eventHeaderLocation" defaults="Location" />}
        >
          <TruncatedLinkify>{poll.location}</TruncatedLinkify>
        </DetailItem>
      ) : null}
      {poll.conferencing ? (
        <DetailItem
          label={<Trans i18nKey="eventHeaderVideoCall" defaults="Video call" />}
        >
          <span className="flex items-center gap-1.5">
            <PollConferencingSummary
              conferencing={poll.conferencing}
              meetingUri={poll.event?.conferencingUri}
            />
          </span>
        </DetailItem>
      ) : null}
      <DetailItem
        className="col-span-2 lg:col-span-1"
        label={<Trans i18nKey="responseOptions" defaults="Response options" />}
      >
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 lg:flex-col">
          <li className="flex items-center gap-1.5">
            <VoteIcon type="yes" />
            <Trans i18nKey="yes" defaults="Yes" />
          </li>
          {poll.allowTentativeVotes ? (
            <li className="flex items-center gap-1.5">
              <VoteIcon type="ifNeedBe" />
              <Trans i18nKey="ifNeedBe" defaults="If need be" />
            </li>
          ) : null}
          <li className="flex items-center gap-1.5">
            <VoteIcon type="no" />
            <Trans i18nKey="no" defaults="No" />
          </li>
        </ul>
      </DetailItem>
    </dl>
  );
}
