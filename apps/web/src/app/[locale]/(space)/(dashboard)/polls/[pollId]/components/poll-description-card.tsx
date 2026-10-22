"use client";

import { posthog } from "@rallly/posthog/client";
import { buttonVariants } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { toast } from "@rallly/ui/sonner";
import copy from "copy-to-clipboard";
import {
  CalendarDaysIcon,
  ClockIcon,
  CopyIcon,
  GlobeIcon,
  MapPinIcon,
  PencilIcon,
  UserPlusIcon,
} from "lucide-react";
import { Link } from "@/components/link";
import { PollConferencingSummary } from "@/features/conferencing/components/poll-conferencing-summary";
import { usePoll } from "@/features/poll/client";
import {
  EventMetaItem,
  EventMetaList,
} from "@/features/poll/components/event-meta";
import {
  SharePollDialog,
  useSharePollDialog,
} from "@/features/poll/components/share-dialog";
import TruncatedLinkify from "@/features/poll/components/truncated-linkify";
import { EventDate } from "@/features/scheduled-event/components/event-date-time";
import { Trans, useTranslation } from "@/i18n/client";
import { Duration } from "@/lib/datetime/duration";
import { RelativeTime } from "@/lib/datetime/relative-time";

/**
 * The head of the Overview thread, written for the host like a pull
 * request's description: who created the poll and when, what it is about,
 * the facts that tell it apart from similarly named polls, and the host's
 * actions on it. The organizer and response legend are left to the
 * participant's event card.
 */
export function PollDescriptionCard({
  description,
  options,
}: {
  description: React.ReactNode;
  /** The poll's options, earliest first. */
  options: { startTime: Date; duration: number }[];
}) {
  const poll = usePoll();
  const { t } = useTranslation();
  const share = useSharePollDialog(poll.id);
  const name = poll.user?.name;
  const first = options[0];
  const last = options[options.length - 1];
  const allDay = options.every((option) => option.duration === 0);
  // One length for every option reads as the event's length; mixed lengths
  // say nothing useful in one line, so they are left out.
  const duration =
    first && options.every((option) => option.duration === first.duration)
      ? first.duration
      : null;

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-card-border bg-card">
        <div className="flex flex-wrap items-baseline gap-x-1.5 border-card-border border-b bg-muted/50 px-4 py-2 text-sm">
          {name ? (
            <Trans
              i18nKey="pollDescriptionCardCreatedBy"
              defaults="<b>{name}</b> created this poll"
              values={{ name }}
              components={{ b: <b className="font-medium" /> }}
            />
          ) : (
            <Trans
              i18nKey="pollDescriptionCardCreated"
              defaults="Poll created"
            />
          )}
          <RelativeTime
            value={poll.createdAt}
            className="text-muted-foreground text-xs"
          />
        </div>
        <div className="space-y-3 px-4 py-3">
          <div className="space-y-1">
            <h2 className="font-semibold text-base">{poll.title}</h2>
            {poll.description ? description : null}
          </div>
          <EventMetaList>
            {first && last ? (
              <EventMetaItem>
                <CalendarDaysIcon />
                <span>
                  <EventDate
                    value={first.startTime}
                    allDay={allDay}
                    timeZone={poll.timeZone}
                    preset="weekdayMonthDayShort"
                  />
                  {options.length > 1 ? (
                    <>
                      {" – "}
                      <EventDate
                        value={last.startTime}
                        allDay={allDay}
                        timeZone={poll.timeZone}
                        preset="weekdayMonthDayShort"
                      />
                    </>
                  ) : null}{" "}
                  <span className="text-muted-foreground">
                    <Trans
                      i18nKey="pollDescriptionCardOptionsInRange"
                      defaults="({count, plural, one {# option} other {# options}})"
                      values={{ count: options.length }}
                    />
                  </span>
                </span>
              </EventMetaItem>
            ) : null}
            {allDay ? (
              <EventMetaItem>
                <ClockIcon />
                <Trans i18nKey="allDay" defaults="All day" />
              </EventMetaItem>
            ) : duration ? (
              <EventMetaItem>
                <ClockIcon />
                <Duration minutes={duration} />
              </EventMetaItem>
            ) : null}
            {poll.location ? (
              <EventMetaItem>
                <MapPinIcon />
                <TruncatedLinkify>{poll.location}</TruncatedLinkify>
              </EventMetaItem>
            ) : null}
            {poll.conferencing ? (
              <EventMetaItem>
                <PollConferencingSummary
                  conferencing={poll.conferencing}
                  meetingUri={poll.event?.conferencingUri}
                />
              </EventMetaItem>
            ) : null}
            {poll.timeZone && !allDay ? (
              <EventMetaItem>
                <GlobeIcon />
                {poll.timeZone}
              </EventMetaItem>
            ) : null}
          </EventMetaList>
        </div>
        <div className="flex flex-wrap gap-2 border-card-border border-t px-4 py-2.5">
          {poll.status === "scheduled" ? null : (
            <Link
              href={`/poll/${poll.id}/edit?from=admin`}
              className={buttonVariants({ size: "sm" })}
            >
              <PencilIcon data-icon="inline-start" />
              <Trans i18nKey="edit" defaults="Edit" />
            </Link>
          )}
          <Button
            size="sm"
            onClick={() => {
              // Only claims success when the copy actually went through
              if (!copy(poll.inviteLink)) return;
              posthog?.capture("poll_share:invite_link_copy", {
                poll_id: poll.id,
              });
              toast.success(t("linkCopied", { defaultValue: "Link copied" }));
            }}
          >
            <CopyIcon data-icon="inline-start" />
            <Trans i18nKey="copyLink" defaults="Copy link" />
          </Button>
          <Button size="sm" onClick={() => share.open("manual")}>
            <UserPlusIcon data-icon="inline-start" />
            <Trans
              i18nKey="pollDescriptionCardInviteParticipants"
              defaults="Invite participants"
            />
          </Button>
        </div>
      </div>
      <SharePollDialog
        {...share.dialog.dialogProps}
        pollId={poll.id}
        pollStatus={poll.status}
        inviteLink={poll.inviteLink}
      />
    </>
  );
}
