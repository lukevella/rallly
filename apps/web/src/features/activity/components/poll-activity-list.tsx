"use client";

import { cn } from "@rallly/ui";
import type { LucideIcon } from "lucide-react";
import {
  BellIcon,
  CalendarCheckIcon,
  CalendarMinusIcon,
  CalendarPlusIcon,
  CircleStopIcon,
  MailIcon,
  MailOpenIcon,
  MailXIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  TrashIcon,
  UserMinusIcon,
  UserPenIcon,
  UserPlusIcon,
} from "lucide-react";
import type { PollActivityEvent } from "@/features/activity/schema";
import {
  EventDate,
  EventTimeRange,
} from "@/features/scheduled-event/components/event-date-time";
import { Trans } from "@/i18n/client";
import { Time } from "@/lib/datetime/time";

type ActivityRow = {
  id: string;
  createdAt: Date;
  event: PollActivityEvent;
};

const iconByType: Record<PollActivityEvent["type"], LucideIcon> = {
  poll_created: PlusIcon,
  poll_updated: PencilIcon,
  poll_closed: CircleStopIcon,
  poll_reopened: PlayIcon,
  poll_deleted: TrashIcon,
  poll_scheduled: CalendarCheckIcon,
  invite_sent: MailIcon,
  invite_opened: MailOpenIcon,
  invite_reminded: BellIcon,
  invite_revoked: MailXIcon,
  invites_revoked_bulk: MailXIcon,
  response_created: UserPlusIcon,
  response_updated: UserPenIcon,
  response_deleted: UserMinusIcon,
  option_added: CalendarPlusIcon,
  option_deleted: CalendarMinusIcon,
};

// Tints group events by what they did to the poll. Colour only reinforces
// the icon and the sentence; neither depends on it.
const toneClassName = {
  added: "bg-lime-500/10 text-lime-600 dark:text-lime-400",
  changed: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  removed: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  closed: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  milestone: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  invite: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
};

const toneByType: Record<
  PollActivityEvent["type"],
  keyof typeof toneClassName
> = {
  poll_created: "milestone",
  poll_updated: "changed",
  poll_closed: "closed",
  poll_reopened: "added",
  poll_deleted: "removed",
  poll_scheduled: "milestone",
  invite_sent: "invite",
  invite_opened: "invite",
  invite_reminded: "invite",
  invite_revoked: "removed",
  invites_revoked_bulk: "removed",
  response_created: "added",
  response_updated: "changed",
  response_deleted: "removed",
  option_added: "added",
  option_deleted: "removed",
};

function OptionChip({
  start,
  duration,
  timeZone,
}: {
  start: string;
  duration: number;
  timeZone: string | null;
}) {
  const allDay = duration === 0;
  const startDate = new Date(start);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-1.5 py-0.5 font-medium">
      <EventDate
        value={startDate}
        allDay={allDay}
        timeZone={timeZone}
        preset="date"
      />
      {allDay ? null : (
        <EventTimeRange
          start={startDate}
          end={new Date(startDate.getTime() + duration * 60_000)}
          allDay={false}
          timeZone={timeZone}
          className="text-muted-foreground"
        />
      )}
    </span>
  );
}

function ActivityDescription({
  event,
  timeZone,
}: {
  event: PollActivityEvent;
  timeZone: string | null;
}) {
  const b = <b className="font-medium" />;
  switch (event.type) {
    case "poll_created":
      return (
        <Trans i18nKey="pollActivityPollCreated" defaults="Poll created" />
      );
    case "poll_updated":
      return (
        <Trans
          i18nKey="pollActivityPollUpdated"
          defaults="Poll details updated"
        />
      );
    case "poll_closed":
      return event.payload.reason === "auto" ? (
        <Trans
          i18nKey="pollActivityPollClosedAuto"
          defaults="Poll closed automatically"
        />
      ) : (
        <Trans i18nKey="pollActivityPollClosed" defaults="Poll closed" />
      );
    case "poll_reopened":
      return (
        <Trans i18nKey="pollActivityPollReopened" defaults="Poll reopened" />
      );
    case "poll_deleted":
      return (
        <Trans i18nKey="pollActivityPollDeleted" defaults="Poll deleted" />
      );
    case "poll_scheduled":
      return (
        <>
          <Trans
            i18nKey="pollActivityPollScheduled"
            defaults="Poll scheduled"
          />{" "}
          <OptionChip
            start={event.payload.start}
            duration={event.payload.duration}
            timeZone={timeZone}
          />
        </>
      );
    case "invite_sent":
      return (
        <Trans
          i18nKey="pollActivityInviteSent"
          defaults="Invite sent to <b>{email}</b>"
          values={{ email: event.payload.email }}
          components={{ b }}
        />
      );
    case "invite_opened":
      return (
        <Trans
          i18nKey="pollActivityInviteOpened"
          defaults="<b>{email}</b> opened their invite"
          values={{ email: event.payload.email }}
          components={{ b }}
        />
      );
    case "invite_reminded":
      return (
        <Trans
          i18nKey="pollActivityInviteReminded"
          defaults="Reminder sent to <b>{email}</b>"
          values={{ email: event.payload.email }}
          components={{ b }}
        />
      );
    case "invite_revoked":
      return (
        <Trans
          i18nKey="pollActivityInviteRevoked"
          defaults="Invite to <b>{email}</b> revoked"
          values={{ email: event.payload.email }}
          components={{ b }}
        />
      );
    case "invites_revoked_bulk":
      return (
        <Trans
          i18nKey="pollActivityInvitesRevokedBulk"
          defaults="{count, plural, one {1 invite revoked} other {# invites revoked}}"
          values={{ count: event.payload.count }}
        />
      );
    case "response_created":
      return (
        <Trans
          i18nKey="pollActivityResponseCreated"
          defaults="<b>{name}</b> responded"
          values={{ name: event.payload.name }}
          components={{ b }}
        />
      );
    case "response_updated":
      return (
        <Trans
          i18nKey="pollActivityResponseUpdated"
          defaults="<b>{name}</b> updated their response"
          values={{ name: event.payload.name }}
          components={{ b }}
        />
      );
    case "response_deleted":
      return (
        <Trans
          i18nKey="pollActivityResponseDeleted"
          defaults="Response from <b>{name}</b> deleted"
          values={{ name: event.payload.name }}
          components={{ b }}
        />
      );
    case "option_added":
      return (
        <>
          <Trans i18nKey="pollActivityOptionAdded" defaults="Date added" />{" "}
          <OptionChip
            start={event.payload.start}
            duration={event.payload.duration}
            timeZone={timeZone}
          />
        </>
      );
    case "option_deleted":
      return (
        <>
          <Trans i18nKey="pollActivityOptionDeleted" defaults="Date removed" />{" "}
          <OptionChip
            start={event.payload.start}
            duration={event.payload.duration}
            timeZone={timeZone}
          />
        </>
      );
  }
}

export function PollActivityList({
  activity,
  timeZone,
  className,
}: {
  activity: ActivityRow[];
  timeZone: string | null;
  className?: string;
}) {
  return (
    <ol className={cn("flex flex-col", className)}>
      {activity.map(({ id, createdAt, event }) => {
        const Icon = iconByType[event.type];
        const note =
          event.type === "response_created" ? event.payload.note : undefined;
        return (
          <li key={id} className="group relative flex gap-3 pb-6 last:pb-0">
            {/* The rail joining this event's icon to the next one */}
            <div
              aria-hidden
              className="absolute top-9 bottom-1 left-4 w-px -translate-x-1/2 bg-border group-last:hidden"
            />
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full",
                toneClassName[toneByType[event.type]],
              )}
            >
              <Icon aria-hidden className="size-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-1 pt-1.5">
              <p className="text-sm leading-5">
                <ActivityDescription event={event} timeZone={timeZone} />
              </p>
              <Time
                value={createdAt}
                preset="datetime"
                className="block text-muted-foreground text-xs"
              />
              {note ? (
                <p className="mt-2 whitespace-pre-wrap rounded-lg border bg-card px-3 py-2 text-sm">
                  {note}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
