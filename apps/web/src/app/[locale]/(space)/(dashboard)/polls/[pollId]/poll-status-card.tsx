import { buttonVariants } from "@rallly/ui";
import { Card, CardContent } from "@rallly/ui/card";
import { shortUrl } from "@rallly/utils/absolute-url";
import Link from "next/link";
import { PollStatusIcon } from "@/features/poll/components/poll-status-icon";
import type { PollClosedReason, PollStatus } from "@/features/poll/schema";
import { formatEventDateTime } from "@/features/scheduled-event/utils";
import { Trans } from "@/i18n/client";
import { getLocale } from "@/i18n/server/get-locale";
import {
  getDeviceDateTimeConfig,
  getDeviceTimeZone,
} from "@/lib/datetime/server";
import { CopyInviteLinkButton } from "./copy-invite-link-button";
import { ReopenPollButton } from "./reopen-poll-button";

function StatusCard({
  status,
  heading,
  description,
  action,
}: {
  status: PollStatus;
  heading: React.ReactNode;
  description: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5">
            <PollStatusIcon status={status} showTooltip={false} />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm">{heading}</div>
            <div className="mt-0.5 text-muted-foreground text-sm">
              {description}
            </div>
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </CardContent>
    </Card>
  );
}

export function OpenPollStatusCard({
  pollId,
  participantCount,
}: {
  pollId: string;
  participantCount: number;
}) {
  return (
    <StatusCard
      status="open"
      heading={
        <Trans
          i18nKey="statusCardAcceptingResponses"
          defaults="Accepting responses"
        />
      }
      description={
        <Trans
          i18nKey="statusCardResponseCount"
          defaults="{count, plural, =0 {No responses yet} one {# response received} other {# responses received}}"
          values={{ count: participantCount }}
        />
      }
      action={
        <CopyInviteLinkButton inviteUrl={shortUrl(`/invite/${pollId}`)} />
      }
    />
  );
}

export function ClosedPollStatusCard({
  pollId,
  closedReason,
  showReopen,
}: {
  pollId: string;
  closedReason: PollClosedReason | null;
  showReopen: boolean;
}) {
  return (
    <StatusCard
      status="closed"
      heading={<Trans i18nKey="pollStatusClosed" defaults="Closed" />}
      description={
        closedReason === "auto" ? (
          <Trans
            i18nKey="statusCardClosedAutoDescription"
            defaults="This poll closed automatically and is no longer accepting responses."
          />
        ) : (
          <Trans
            i18nKey="statusCardClosedDescription"
            defaults="This poll is no longer accepting responses."
          />
        )
      }
      action={showReopen ? <ReopenPollButton pollId={pollId} /> : undefined}
    />
  );
}

export async function ScheduledPollStatusCard({
  eventId,
  eventTitle,
  start,
  end,
  allDay,
  eventTimeZone,
}: {
  eventId: string;
  eventTitle: string;
  start: Date;
  end: Date;
  allDay: boolean;
  eventTimeZone: string | null;
}) {
  // Device zone rather than getDeviceDateTimeConfig's session override — the
  // override is a poll-viewing aid for public pages, not a statement about
  // where the viewer is; the per-device time format preference still applies.
  const [locale, deviceTimeZone, { timeFormat }] = await Promise.all([
    getLocale(),
    getDeviceTimeZone(),
    getDeviceDateTimeConfig(),
  ]);

  const { dow, date, time } = formatEventDateTime({
    start,
    end,
    allDay,
    timeZone: eventTimeZone,
    inviteeTimeZone: deviceTimeZone,
    locale,
    timeFormat,
  });

  return (
    <StatusCard
      status="scheduled"
      heading={eventTitle}
      description={
        <>
          {dow}, {date}
          {time ? <> &middot; {time}</> : null}
        </>
      }
      action={
        <Link href={`/e/${eventId}`} className={buttonVariants()}>
          <Trans i18nKey="goToEvent" defaults="Go to event" />
        </Link>
      }
    />
  );
}
