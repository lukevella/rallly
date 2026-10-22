"use client";

import { cn } from "@rallly/ui";
import type { LucideIcon } from "lucide-react";
import {
  AlignLeftIcon,
  ArrowRightLeftIcon,
  BarChart2Icon,
  BellIcon,
  CalendarCheckIcon,
  CalendarMinusIcon,
  CalendarPlusIcon,
  ChevronRightIcon,
  CircleStopIcon,
  GlobeIcon,
  ListChecksIcon,
  MailIcon,
  MailOpenIcon,
  MailXIcon,
  MapPinIcon,
  MessageCircleIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  Settings2Icon,
  TrashIcon,
  TypeIcon,
  UserMinusIcon,
  UserPenIcon,
  UserPlusIcon,
  VenetianMaskIcon,
  VideoIcon,
} from "lucide-react";
import * as React from "react";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import type { PollActivityEvent, PollChange } from "@/features/activity/schema";
import type {
  ActivityRow,
  GroupableActivityType,
} from "@/features/activity/utils";
import { groupActivity } from "@/features/activity/utils";
import type { PollConferencing } from "@/features/conferencing/schema";
import { conferencingProviderLabels } from "@/features/conferencing/utils";
import {
  EventDate,
  EventTimeRange,
} from "@/features/scheduled-event/components/event-date-time";
import { Trans } from "@/i18n/client";
import { RelativeTime } from "@/lib/datetime/relative-time";
import { Time } from "@/lib/datetime/time";

const iconByType: Record<PollActivityEvent["type"], LucideIcon> = {
  poll_created: PlusIcon,
  poll_updated: PencilIcon,
  poll_closed: CircleStopIcon,
  poll_reopened: PlayIcon,
  poll_deleted: TrashIcon,
  poll_organizer_changed: ArrowRightLeftIcon,
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
  options_added: CalendarPlusIcon,
  options_deleted: CalendarMinusIcon,
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
  poll_organizer_changed: "changed",
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
  options_added: "added",
  options_deleted: "removed",
};

function OptionChips({
  options,
  timeZone,
}: {
  options: { optionId: string; start: string; duration: number }[];
  timeZone: string | null;
}) {
  return (
    <span className="mt-1.5 flex flex-wrap gap-1.5">
      {options.map((option) => (
        <OptionChip
          key={option.optionId}
          start={option.start}
          duration={option.duration}
          timeZone={timeZone}
        />
      ))}
    </span>
  );
}

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

const iconByChange: Record<PollChange["field"], LucideIcon> = {
  title: TypeIcon,
  description: AlignLeftIcon,
  location: MapPinIcon,
  conferencing: VideoIcon,
  timeZone: GlobeIcon,
  hideParticipants: VenetianMaskIcon,
  hideScores: BarChart2Icon,
  disableComments: MessageCircleIcon,
  allowTentativeVotes: ListChecksIcon,
  requireParticipantEmail: MailIcon,
  settings: Settings2Icon,
};

function toneOfChange(change: PollChange): keyof typeof toneClassName {
  if ("action" in change) {
    return change.action === "added"
      ? "added"
      : change.action === "removed"
        ? "removed"
        : "changed";
  }
  switch (change.field) {
    // Tinted by what participants gain or lose: hiding something or
    // requiring an email takes something away.
    case "hideParticipants":
    case "hideScores":
    case "disableComments":
    case "requireParticipantEmail":
      return change.from ? "added" : "removed";
    case "allowTentativeVotes":
      return change.from ? "removed" : "added";
    default:
      return "changed";
  }
}

const conferencingName = (conferencing: PollConferencing) =>
  conferencing.provider === "custom"
    ? conferencing.label
    : conferencingProviderLabels[conferencing.provider];

function ChangeDescription({ change }: { change: PollChange }) {
  const b = <b className="font-medium" />;
  switch (change.field) {
    case "title":
      return (
        <Trans
          i18nKey="pollActivityTitleChanged"
          defaults="Title changed from <b>{from}</b>"
          values={{ from: change.from }}
          components={{ b }}
        />
      );
    case "description":
      return change.action === "added" ? (
        <Trans
          i18nKey="pollActivityDescriptionAdded"
          defaults="Description added"
        />
      ) : change.action === "removed" ? (
        <Trans
          i18nKey="pollActivityDescriptionRemoved"
          defaults="Description removed"
        />
      ) : (
        <Trans
          i18nKey="pollActivityDescriptionChanged"
          defaults="Description changed"
        />
      );
    case "location":
      return change.action === "added" ? (
        <Trans i18nKey="pollActivityLocationAdded" defaults="Location added" />
      ) : change.action === "removed" ? (
        <Trans
          i18nKey="pollActivityLocationRemoved"
          defaults="Location <b>{from}</b> removed"
          values={{ from: change.from }}
          components={{ b }}
        />
      ) : (
        <Trans
          i18nKey="pollActivityLocationChanged"
          defaults="Location changed from <b>{from}</b>"
          values={{ from: change.from }}
          components={{ b }}
        />
      );
    case "conferencing":
      return change.action === "added" || !change.from ? (
        <Trans
          i18nKey="pollActivityConferencingAdded"
          defaults="Video call added"
        />
      ) : change.action === "removed" ? (
        <Trans
          i18nKey="pollActivityConferencingRemoved"
          defaults="Video call <b>{from}</b> removed"
          values={{ from: conferencingName(change.from) }}
          components={{ b }}
        />
      ) : (
        <Trans
          i18nKey="pollActivityConferencingChanged"
          defaults="Video call changed from <b>{from}</b>"
          values={{ from: conferencingName(change.from) }}
          components={{ b }}
        />
      );
    case "timeZone":
      return (
        <Trans
          i18nKey="pollActivityTimeZoneChanged"
          defaults="Time zone changed"
        />
      );
    case "hideParticipants":
      return change.from ? (
        <Trans
          i18nKey="pollActivityParticipantNamesShown"
          defaults="Participant names shown"
        />
      ) : (
        <Trans
          i18nKey="pollActivityParticipantNamesHidden"
          defaults="Participant names hidden"
        />
      );
    case "hideScores":
      return change.from ? (
        <Trans i18nKey="pollActivityVotesShown" defaults="Votes shown" />
      ) : (
        <Trans i18nKey="pollActivityVotesHidden" defaults="Votes hidden" />
      );
    case "disableComments":
      return change.from ? (
        <Trans
          i18nKey="pollActivityCommentsTurnedOn"
          defaults="Comments turned on"
        />
      ) : (
        <Trans
          i18nKey="pollActivityCommentsTurnedOff"
          defaults="Comments turned off"
        />
      );
    case "allowTentativeVotes":
      return change.from ? (
        <Trans
          i18nKey="pollActivityIfNeedBeTurnedOff"
          defaults="“If need be” answers turned off"
        />
      ) : (
        <Trans
          i18nKey="pollActivityIfNeedBeTurnedOn"
          defaults="“If need be” answers turned on"
        />
      );
    case "requireParticipantEmail":
      return change.from ? (
        <Trans
          i18nKey="pollActivityParticipantEmailOptional"
          defaults="Participant email optional"
        />
      ) : (
        <Trans
          i18nKey="pollActivityParticipantEmailRequired"
          defaults="Participant email required"
        />
      );
    case "settings":
      return (
        <Trans
          i18nKey="pollActivitySettingsChanged"
          defaults="Settings changed"
        />
      );
  }
}

function ActivityDescription({
  event,
  timeZone,
  pollCreatorName,
}: {
  event: PollActivityEvent;
  timeZone: string | null;
  pollCreatorName?: string;
}) {
  const b = <b className="font-medium" />;
  switch (event.type) {
    case "poll_created":
      return pollCreatorName ? (
        <Trans
          i18nKey="pollActivityPollCreatedBy"
          defaults="Poll created by <b>{name}</b>"
          values={{ name: pollCreatorName }}
          components={{ b }}
        />
      ) : (
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
    case "poll_organizer_changed":
      return (
        <Trans
          i18nKey="pollActivityOrganizerChanged"
          defaults="Organizer changed from <b>{from}</b> to <b>{to}</b>"
          values={{
            from: event.payload.from.name,
            to: event.payload.to.name,
          }}
          components={{ b }}
        />
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
    case "options_added":
      return (
        <>
          <Trans
            i18nKey="pollActivityOptionsAdded"
            defaults="{count, plural, one {Date added} other {# dates added}}"
            values={{ count: event.payload.options.length }}
          />
          <OptionChips
            options={event.payload.options}
            timeZone={
              event.payload.timeZone === undefined
                ? timeZone
                : event.payload.timeZone
            }
          />
        </>
      );
    case "options_deleted":
      return (
        <>
          <Trans
            i18nKey="pollActivityOptionsDeleted"
            defaults="{count, plural, one {Date removed} other {# dates removed}}"
            values={{ count: event.payload.options.length }}
          />
          <OptionChips
            options={event.payload.options}
            timeZone={
              event.payload.timeZone === undefined
                ? timeZone
                : event.payload.timeZone
            }
          />
        </>
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

type Entry = {
  key: string;
  createdAt: Date;
  Icon: LucideIcon;
  tone: keyof typeof toneClassName;
  description: React.ReactNode;
  note?: string;
  participant?: { id: string; name: string };
};

function entriesOf(
  { id, createdAt, event }: ActivityRow,
  {
    timeZone,
    pollCreatorName,
  }: { timeZone: string | null; pollCreatorName?: string },
): Entry[] {
  // An itemized edit shows one line per field it changed.
  if (event.type === "poll_updated" && event.payload.changes?.length) {
    return event.payload.changes.map((change, index) => ({
      key: `${id}:${index}`,
      createdAt,
      Icon: iconByChange[change.field],
      tone: toneOfChange(change),
      description: <ChangeDescription change={change} />,
    }));
  }
  return [
    {
      key: id,
      createdAt,
      Icon: iconByType[event.type],
      tone: toneByType[event.type],
      description: (
        <ActivityDescription
          event={event}
          timeZone={timeZone}
          pollCreatorName={pollCreatorName}
        />
      ),
      note: event.type === "response_created" ? event.payload.note : undefined,
      participant:
        event.type === "response_created" ||
        event.type === "response_updated" ||
        event.type === "response_deleted"
          ? { id: event.participantId, name: event.payload.name }
          : undefined,
    },
  ];
}

function Rail() {
  return (
    <div
      aria-hidden
      className="absolute top-9 bottom-1 left-4 w-px -translate-x-1/2 bg-border group-last:hidden"
    />
  );
}

function EntryIcon({
  entry,
  compact,
  participantImages,
}: {
  entry: Entry;
  compact: boolean;
  participantImages?: Record<string, string | null>;
}) {
  const { Icon, tone, participant } = entry;
  return participant ? (
    <OptimizedAvatarImage
      size="md"
      name={participant.name}
      src={participantImages?.[participant.id] ?? undefined}
    />
  ) : (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        "size-8",
        toneClassName[tone],
      )}
    >
      <Icon aria-hidden className="size-4" />
    </div>
  );
}

function EntryItem({
  entry,
  compact,
  participantImages,
}: {
  entry: Entry;
  compact: boolean;
  participantImages?: Record<string, string | null>;
}) {
  return (
    <li
      className={cn(
        "group relative flex gap-3 last:pb-0",
        compact ? "pb-8" : "pb-6",
      )}
    >
      {/* The rail joining this event's icon to the next one */}
      <Rail />
      <EntryIcon
        entry={entry}
        compact={compact}
        participantImages={participantImages}
      />
      <div className={cn("min-w-0 flex-1", !compact && "space-y-1 pt-1.5")}>
        {compact ? (
          <div className="flex items-baseline gap-3 pt-1 text-sm leading-6">
            <p className="min-w-0 flex-1">{entry.description}</p>
            <RelativeTime
              value={entry.createdAt}
              className="shrink-0 text-muted-foreground"
            />
          </div>
        ) : (
          <>
            <p className="text-sm leading-5">{entry.description}</p>
            <Time
              value={entry.createdAt}
              preset="datetime"
              className="block text-muted-foreground text-xs"
            />
          </>
        )}
        {entry.note ? (
          <blockquote className="mt-1 whitespace-pre-wrap border-border border-l-2 pl-3 text-muted-foreground text-sm">
            {entry.note}
          </blockquote>
        ) : null}
      </div>
    </li>
  );
}

const nameOf = (row: ActivityRow) =>
  "name" in row.event.payload ? String(row.event.payload.name) : "";

function GroupDescription({
  type,
  rows,
}: {
  type: GroupableActivityType;
  rows: ActivityRow[];
}) {
  const b = <b className="font-medium" />;
  const count = rows.length;
  const [first, second] = rows.map(nameOf);
  switch (type) {
    case "invite_sent":
      return (
        <Trans
          i18nKey="pollActivityGroupInvitesSent"
          defaults="Invites sent to {count} people"
          values={{ count }}
        />
      );
    case "invite_reminded":
      return (
        <Trans
          i18nKey="pollActivityGroupReminded"
          defaults="Reminders sent to {count} people"
          values={{ count }}
        />
      );
    case "response_deleted":
      return (
        <Trans
          i18nKey="pollActivityGroupResponsesDeleted"
          defaults="{count} responses deleted"
          values={{ count }}
        />
      );
    case "response_updated":
      return count === 2 ? (
        <Trans
          i18nKey="pollActivityGroupUpdatedTwo"
          defaults="<b>{first}</b> and <b>{second}</b> updated their responses"
          values={{ first, second }}
          components={{ b }}
        />
      ) : (
        <Trans
          i18nKey="pollActivityGroupUpdated"
          defaults="<b>{first}</b>, <b>{second}</b> and {count, plural, one {# other} other {# others}} updated their responses"
          values={{ first, second, count: count - 2 }}
          components={{ b }}
        />
      );
    case "response_created":
      return count === 2 ? (
        <Trans
          i18nKey="pollActivityGroupRespondedTwo"
          defaults="<b>{first}</b> and <b>{second}</b> responded"
          values={{ first, second }}
          components={{ b }}
        />
      ) : (
        <Trans
          i18nKey="pollActivityGroupResponded"
          defaults="<b>{first}</b>, <b>{second}</b> and {count, plural, one {# other} other {# others}} responded"
          values={{ first, second, count: count - 2 }}
          components={{ b }}
        />
      );
  }
}

/**
 * A run of like events as one row that expands in place into the events it
 * stands for.
 */
function GroupItem({
  type,
  rows,
  timeZone,
  participantImages,
}: {
  type: GroupableActivityType;
  rows: ActivityRow[];
  timeZone: string | null;
  participantImages?: Record<string, string | null>;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const latest = rows[rows.length - 1];
  const people = rows.flatMap((row) =>
    "participantId" in row.event
      ? [{ id: row.event.participantId, name: nameOf(row) }]
      : [],
  );
  const Icon = iconByType[type];
  return (
    <li className="group relative flex gap-3 pb-8 last:pb-0">
      <Rail />
      {/* The first person stands for the group in the icon column, which
          keeps every row's text aligned; the rest appear when expanded */}
      {people[0] ? (
        <OptimizedAvatarImage
          size="md"
          name={people[0].name}
          src={participantImages?.[people[0].id] ?? undefined}
        />
      ) : (
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            toneClassName[toneByType[type]],
          )}
        >
          <Icon aria-hidden className="size-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-3 pt-1 text-sm leading-6">
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            className="flex min-w-0 flex-1 items-baseline gap-1 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="min-w-0">
              <GroupDescription type={type} rows={rows} />
            </span>
            <ChevronRightIcon
              aria-hidden
              className={cn(
                "size-3.5 shrink-0 self-center text-muted-foreground transition-transform",
                expanded && "rotate-90",
              )}
            />
          </button>
          {latest ? (
            <RelativeTime
              value={latest.createdAt}
              className="shrink-0 text-muted-foreground"
            />
          ) : null}
        </div>
        {expanded ? (
          <ol className="mt-3 flex flex-col">
            {rows
              .flatMap((row) => entriesOf(row, { timeZone }))
              .map((entry) => (
                <EntryItem
                  key={entry.key}
                  entry={entry}
                  compact
                  participantImages={participantImages}
                />
              ))}
          </ol>
        ) : null}
      </div>
    </li>
  );
}

/**
 * `compact` is the secondary timeline under a headline card: smaller icons,
 * a relative time right aligned on the event's line, and runs of like events
 * grouped (see groupActivity). Events about a response show the participant's
 * avatar in place of an icon; `participantImages` supplies photos by
 * participant id where they have one.
 */
export function PollActivityList({
  activity,
  timeZone,
  compact = false,
  participantImages,
  pollCreatorName,
  className,
}: {
  activity: ActivityRow[];
  timeZone: string | null;
  compact?: boolean;
  participantImages?: Record<string, string | null>;
  /** Names who created the poll; the event itself records only an id. */
  pollCreatorName?: string;
  className?: string;
}) {
  const context = { timeZone, pollCreatorName };
  return (
    <ol className={cn("flex flex-col", className)}>
      {compact
        ? groupActivity(activity).map((item) =>
            item.kind === "group" ? (
              <GroupItem
                key={item.rows[0]?.id}
                type={item.type}
                rows={item.rows}
                timeZone={timeZone}
                participantImages={participantImages}
              />
            ) : (
              entriesOf(item.row, context).map((entry) => (
                <EntryItem
                  key={entry.key}
                  entry={entry}
                  compact
                  participantImages={participantImages}
                />
              ))
            ),
          )
        : activity
            .flatMap((row) => entriesOf(row, context))
            .map((entry) => (
              <EntryItem
                key={entry.key}
                entry={entry}
                compact={false}
                participantImages={participantImages}
              />
            ))}
    </ol>
  );
}
