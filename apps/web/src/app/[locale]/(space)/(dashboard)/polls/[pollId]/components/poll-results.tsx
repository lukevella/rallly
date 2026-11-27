"use client";

import { posthog } from "@rallly/posthog/client";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@rallly/ui/popover";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@rallly/ui/segmented-control";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import {
  CalendarXIcon,
  ChevronDownIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ClockIcon,
  DownloadIcon,
  ListIcon,
  MessageSquareTextIcon,
  Table2Icon,
  TrashIcon,
  UsersIcon,
} from "lucide-react";
import React from "react";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { usePoll } from "@/features/poll/client";
import { useCsvExporter } from "@/features/poll/components/manage-poll/use-csv-exporter";
import {
  CopyEditLinkMenuItem,
  DeleteParticipantModal,
} from "@/features/poll/components/participant-dropdown";
import VoteIcon from "@/features/poll/components/vote-icon";
import type { VoteType } from "@/features/poll/constants";
import { rankOptionsByPopularity } from "@/features/poll/utils";
import { Trans, useTranslation } from "@/i18n/client";
import { useDateTime, useDateTimeConfig } from "@/lib/datetime/client";
import { formatDateParts, formatDuration } from "@/lib/datetime/format";
import { RelativeTime } from "@/lib/datetime/relative-time";
import { ChatBubble } from "./chat-bubble";
import { FinalizeDialog } from "./finalize-dialog";
import { PollSection, PollSectionEmpty } from "./poll-section";

type Option = { id: string; startTime: Date; duration: number };
type Participant = {
  id: string;
  name: string;
  image: string | null;
  votes: { optionId: string; type: VoteType }[];
  note: string | null;
  respondedAt: Date;
  viaInvite: boolean;
  editUrl: string;
};
type Sort = "popularity" | "date";
type View = "list" | "table";

/** Every option with its availability, sortable by popularity or date. */
export function PollResults({
  title,
  options,
  participants,
  timeZone,
  canPick,
}: {
  title: React.ReactNode;
  options: Option[];
  participants: Participant[];
  /** Null for a poll whose times float: shown as entered, not converted. */
  timeZone: string | null;
  /** Whether a date can still be picked: not once the poll is scheduled. */
  canPick: boolean;
}) {
  const { t } = useTranslation();
  const { formatDateTime } = useDateTime();
  const [sort, setSort] = React.useState<Sort>("popularity");
  const poll = usePoll();
  const [view, setView] = React.useState<View>("list");
  const finalizeDialog = useDialog();
  const [pickedOptionId, setPickedOptionId] = React.useState<string>();

  const ranked = React.useMemo(
    () => rankOptionsByPopularity({ options, participants }),
    [options, participants],
  );
  const rows = React.useMemo(
    () =>
      sort === "popularity"
        ? ranked
        : [...ranked].sort(
            (a, b) => a.startTime.getTime() - b.startTime.getTime(),
          ),
    [ranked, sort],
  );

  const hasTimes = options.some((option) => option.duration > 0);
  // One duration for every option is stated in the poll details, so the end
  // time would only repeat it.
  const showEndTime =
    hasTimes &&
    !options.every((option) => option.duration === options[0]?.duration);
  const best = ranked[0]
    ? ranked[0].votes.yes.length + ranked[0].votes.ifNeedBe.length
    : 0;

  const topOptions =
    best > 0
      ? ranked.filter(
          (option) =>
            option.votes.yes.length + option.votes.ifNeedBe.length === best,
        )
      : [];
  const topOption = topOptions.length === 1 ? topOptions[0] : undefined;
  const summary = topOption ? (
    <Trans
      i18nKey="pollResultsSummaryBest"
      defaults="Best match: {date}"
      values={{
        date: [
          formatDateTime(
            topOption.startTime,
            "weekdayMonthDayShort",
            optionZone(topOption, timeZone === null),
          ),
          topOption.duration > 0
            ? formatDateTime(
                topOption.startTime,
                "time",
                optionZone(topOption, timeZone === null),
              )
            : null,
        ]
          .filter(Boolean)
          .join(", "),
      }}
    />
  ) : topOptions.length > 1 ? (
    <Trans
      i18nKey="pollResultsSummaryTied"
      defaults="{count} dates tied for best"
      values={{ count: topOptions.length }}
    />
  ) : null;

  return (
    <PollSection
      id="poll-results"
      title={title}
      summary={summary}
      flush={rows.length > 0}
      action={
        <div className="flex flex-wrap items-center gap-2">
          {rows.length > 0 ? <ExportCsvButton /> : null}
          {rows.length > 0 ? (
            <SegmentedControl
              aria-label={t("pollResultsView", { defaultValue: "View" })}
              value={view}
              onValueChange={(value) => {
                setView(value as View);
                posthog?.capture("poll_page:results_view_change", {
                  poll_id: poll.id,
                  view: value,
                  option_count: options.length,
                  participant_count: participants.length,
                });
              }}
            >
              <ViewOption
                value="list"
                label={t("pollResultsViewList", { defaultValue: "List" })}
              >
                <ListIcon aria-hidden="true" className="size-4" />
              </ViewOption>
              <ViewOption
                value="table"
                label={t("pollResultsViewTable", { defaultValue: "Table" })}
              >
                <Table2Icon aria-hidden="true" className="size-4" />
              </ViewOption>
            </SegmentedControl>
          ) : null}
          {ranked.length > 1 ? (
            <SegmentedControl
              aria-label={t("pollResultsSort", { defaultValue: "Sort by" })}
              value={sort}
              onValueChange={(value) => setSort(value as Sort)}
            >
              <SegmentedControlItem value="popularity" className="px-3 text-sm">
                <Trans
                  i18nKey="pollResultsSortPopularity"
                  defaults="Popularity"
                />
              </SegmentedControlItem>
              <SegmentedControlItem value="date" className="px-3 text-sm">
                <Trans i18nKey="pollResultsSortDate" defaults="Date" />
              </SegmentedControlItem>
            </SegmentedControl>
          ) : null}
        </div>
      }
    >
      {rows.length === 0 ? (
        <PollSectionEmpty>
          <Trans
            i18nKey="pollResultsEmpty"
            defaults="This poll has no dates."
          />
        </PollSectionEmpty>
      ) : view === "table" ? (
        <ResultsTable
          options={rows}
          participants={participants}
          floating={timeZone === null}
          hasTimes={hasTimes}
          best={best}
          showDuration={showEndTime}
          onPick={
            canPick
              ? (option) => {
                  setPickedOptionId(option.id);
                  finalizeDialog.trigger();
                }
              : undefined
          }
        />
      ) : (
        <ResultsList
          options={rows}
          participants={participants}
          floating={timeZone === null}
          hasTimes={hasTimes}
          showEndTime={showEndTime}
          best={best}
          onPick={
            canPick
              ? (option) => {
                  setPickedOptionId(option.id);
                  finalizeDialog.trigger();
                }
              : undefined
          }
        />
      )}
      {canPick && pickedOptionId ? (
        <FinalizeDialog
          {...finalizeDialog.dialogProps}
          optionId={pickedOptionId}
        />
      ) : null}
    </PollSection>
  );
}

/**
 * Who can make one option (left) and who can't (right), side by side when
 * there is room.
 * If need be counts as available; people who haven't answered close the
 * second list. Each answer shows as a badge on the avatar.
 */
function VoteBreakdown({
  optionId,
  votes,
  participants,
  participantsById,
}: {
  optionId: string;
  votes: { yes: string[]; ifNeedBe: string[]; no: string[] };
  participants: Participant[];
  participantsById: Map<string, Participant>;
}) {
  if (participants.length === 0) {
    return (
      <EmptyState className="py-4">
        <EmptyStateIcon>
          <UsersIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>
          <Trans i18nKey="pollResultsNoVotes" defaults="No responses yet" />
        </EmptyStateTitle>
      </EmptyState>
    );
  }

  const noAnswer = participants
    .filter((p) => !p.votes.some((vote) => vote.optionId === optionId))
    .map((p) => p.id);
  const available = [
    ...votes.yes.map((id) => ({ id, type: "yes" as VoteType | undefined })),
    ...votes.ifNeedBe.map((id) => ({
      id,
      type: "ifNeedBe" as VoteType | undefined,
    })),
  ];
  const unavailable = [
    ...votes.no.map((id) => ({ id, type: "no" as VoteType | undefined })),
    ...noAnswer.map((id) => ({ id, type: undefined })),
  ];

  if (available.length === 0) {
    return (
      <EmptyState className="py-4">
        <EmptyStateIcon>
          <CalendarXIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>
          <Trans
            i18nKey="pollResultsNoOneAvailable"
            defaults="No one can make it"
          />
        </EmptyStateTitle>
        <EmptyStateDescription>
          <Trans
            i18nKey="pollResultsNoOneAvailableDescription"
            defaults="{count, plural, one {# participant said no or didn't answer for this date.} other {# participants said no or didn't answer for this date.}}"
            values={{ count: unavailable.length }}
          />
        </EmptyStateDescription>
      </EmptyState>
    );
  }

  // One list: who can make it first, then who can't or didn't answer.
  return (
    <BreakdownList
      entries={[...available, ...unavailable]}
      participantsById={participantsById}
    />
  );
}

function BreakdownList({
  entries,
  participantsById,
}: {
  entries: { id: string; type?: VoteType }[];
  participantsById: Map<string, Participant>;
}) {
  return (
    <ul className="flex min-w-0 flex-col gap-2.5">
      {entries.map(({ id, type }) => {
        const participant = participantsById.get(id);
        return participant ? (
          <li key={id} className="flex min-w-0 items-center gap-3">
            {/* The answer as a coloured dot on the avatar, named for screen readers. */}
            <span className="relative shrink-0">
              <OptimizedAvatarImage
                size="sm"
                name={participant.name}
                src={participant.image ?? undefined}
              />
              <VoteDot type={type} />
            </span>
            <span className="truncate text-muted-foreground">
              {participant.name}
            </span>
          </li>
        ) : null;
      })}
    </ul>
  );
}

const voteDotColor: Record<VoteType, string> = {
  yes: "bg-green-500",
  ifNeedBe: "bg-amber-400",
  no: "bg-gray-400",
};

/** A vote as a dot on an avatar's corner; hollow when there is no answer. */
function VoteDot({ type }: { type?: VoteType }) {
  return (
    <span
      className={cn(
        "absolute right-0 bottom-0 size-2 rounded-full ring-2 ring-popover",
        type
          ? voteDotColor[type]
          : "bg-popover shadow-[inset_0_0_0_1.5px_var(--color-gray-400)]",
      )}
    >
      <span className="sr-only">
        {type === "yes" ? (
          <Trans i18nKey="yes" defaults="Yes" />
        ) : type === "ifNeedBe" ? (
          <Trans i18nKey="ifNeedBe" defaults="If need be" />
        ) : type === "no" ? (
          <Trans i18nKey="no" defaults="No" />
        ) : (
          <Trans i18nKey="pending" defaults="Pending" />
        )}
      </span>
    </span>
  );
}

/** An icon-only view option whose label also shows as a tooltip. */
function ViewOption({
  value,
  label,
  children,
}: {
  value: View;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <SegmentedControlItem
            value={value}
            className="px-2"
            aria-label={label}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** Share of respondents available: yes first, then if need be. */
function AvailabilityBar({
  yes,
  ifNeedBe,
  total,
}: {
  yes: number;
  ifNeedBe: number;
  total: number;
}) {
  const percent = (count: number) => (total > 0 ? (count / total) * 100 : 0);
  return (
    <div
      aria-hidden="true"
      className="flex h-1 w-full overflow-hidden rounded-full bg-foreground/10"
    >
      <div
        className="h-full w-(--width) bg-green-500"
        style={{ "--width": `${percent(yes)}%` } as React.CSSProperties}
      />
      <div
        className="h-full w-(--width) bg-amber-400"
        style={{ "--width": `${percent(ifNeedBe)}%` } as React.CSSProperties}
      />
    </div>
  );
}

/**
 * People who can make an option (yes and if need be together), as a button
 * that opens who answered what.
 */
function AvailabilityPopover({
  option,
  participants,
  floating,
  highlight,
  onFinalize,
}: {
  option: Option & {
    votes: { yes: string[]; ifNeedBe: string[]; no: string[] };
  };
  participants: Participant[];
  floating: boolean;
  highlight: boolean;
  /** Omitted once a date can no longer be picked. */
  onFinalize?: () => void;
}) {
  const { formatDateTime } = useDateTime();
  const [open, setOpen] = React.useState(false);
  const count = option.votes.yes.length + option.votes.ifNeedBe.length;
  const participantsById = React.useMemo(
    () =>
      new Map(participants.map((participant) => [participant.id, participant])),
    [participants],
  );
  const zone = optionZone(option, floating);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-1.5 px-2 tabular-nums",
              highlight ? "text-foreground" : "text-muted-foreground",
            )}
          />
        }
      >
        <span aria-hidden="true">{count}</span>
        <span className="sr-only">
          <Trans
            i18nKey="pollResultsAvailableCount"
            defaults="{count} of {total} available"
            values={{ count, total: participants.length }}
          />
        </span>
        <ChevronDownIcon aria-hidden="true" className="size-3.5 opacity-60" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0"
      >
        <div className="flex shrink-0 items-center gap-3 border-popover-border border-b px-4 py-3">
          <DateTile option={option} floating={floating} />
          <div className="min-w-0">
            <p className="font-medium">
              {formatDateTime(option.startTime, "weekdayMonthDay", zone)}
            </p>
            {option.duration > 0 ? (
              <p className="text-muted-foreground tabular-nums">
                {formatDateTime(option.startTime, "time", zone)}
                {" – "}
                {formatDateTime(
                  new Date(
                    option.startTime.getTime() + option.duration * 60_000,
                  ),
                  "time",
                  zone,
                )}
              </p>
            ) : null}
          </div>
        </div>
        {/* Scrolls on its own, so a long list keeps the header and footer
            in view. */}
        <div className="max-h-72 overflow-y-auto overscroll-contain px-4 py-3">
          <VoteBreakdown
            optionId={option.id}
            votes={option.votes}
            participants={participants}
            participantsById={participantsById}
          />
        </div>
        {participants.length > 0 || onFinalize ? (
          <div className="flex shrink-0 flex-col gap-2 border-popover-border border-t p-3">
            {participants.length > 0 ? (
              <p className="text-center text-muted-foreground">
                <Trans
                  i18nKey="pollStatsCanMakeItOfTotal"
                  defaults="{count} of {total} can make it"
                  values={{ count, total: participants.length }}
                />
              </p>
            ) : null}
            {onFinalize ? (
              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  // Closed first, so the finalize dialog isn't stacked on it.
                  setOpen(false);
                  onFinalize();
                }}
              >
                <Trans
                  i18nKey="pollResultsFinalizeThisDate"
                  defaults="Finalize this date"
                />
              </Button>
            ) : null}
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

/** A small calendar page: the weekday over the day of the month. */
function DateTile({ option, floating }: { option: Option; floating: boolean }) {
  const { locale, timeZone } = useDateTimeConfig();
  const { weekday, day } = formatDateParts(option.startTime, {
    locale,
    timeZone: optionZone(option, floating).timeZone ?? timeZone ?? "UTC",
  });
  return (
    <div
      aria-hidden="true"
      className="flex size-10 shrink-0 flex-col overflow-hidden rounded-lg border border-card-border bg-card text-center"
    >
      <div className="border-card-border border-b text-[10px] text-muted-foreground uppercase leading-4">
        {weekday}
      </div>
      <div className="flex grow items-center justify-center font-semibold text-sm tabular-nums leading-none">
        {day}
      </div>
    </div>
  );
}

// All-day dates and floating times are stored as UTC wall time.
export function optionZone(option: Option, floating: boolean) {
  return option.duration === 0 || floating ? { timeZone: "UTC" } : {};
}

/** A month heading, shared by the list and the table. */
function MonthLabel({ month, year }: { month: string; year?: string }) {
  return (
    <span className="inline-flex gap-1 whitespace-nowrap text-muted-foreground text-xs uppercase">
      <span>{month}</span>
      {year ? <span>{year}</span> : null}
    </span>
  );
}

/** Weekday and day of the month, shared by the list and the table. */
function DayLabel({ weekday, day }: { weekday: string; day: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
      <span className="text-muted-foreground">{weekday}</span>
      <span className="font-medium tabular-nums">{day}</span>
    </span>
  );
}

/** Weekday and day number as two cells, under the month's heading. */
function OptionDay({
  option,
  floating,
}: {
  option: Option;
  floating: boolean;
}) {
  const { locale, timeZone } = useDateTimeConfig();
  const { weekday, day } = formatDateParts(option.startTime, {
    locale,
    timeZone: optionZone(option, floating).timeZone ?? timeZone ?? "UTC",
  });
  return <DayLabel weekday={weekday} day={day} />;
}

/**
 * Start, dash and end as three cells of the list's grid, so times align; just
 * the start when every option lasts as long.
 */
function OptionTime({
  option,
  floating,
  showEnd,
}: {
  option: Option;
  floating: boolean;
  showEnd: boolean;
}) {
  const { formatDateTime } = useDateTime();
  const zone = optionZone(option, floating);
  if (!showEnd) {
    return (
      <span className="whitespace-nowrap text-end tabular-nums">
        {option.duration > 0
          ? formatDateTime(option.startTime, "time", zone)
          : null}
      </span>
    );
  }
  if (option.duration === 0) {
    return (
      <>
        <span />
        <span />
        <span />
      </>
    );
  }
  const end = new Date(option.startTime.getTime() + option.duration * 60_000);
  return (
    <span className="col-span-3 grid grid-cols-subgrid gap-x-1.5 whitespace-nowrap text-muted-foreground tabular-nums">
      <span className="text-end text-foreground">
        {formatDateTime(option.startTime, "time", zone)}
      </span>
      <span>–</span>
      <span>{formatDateTime(end, "time", zone)}</span>
    </span>
  );
}

type TableOption = Option & {
  votes: { yes: string[]; ifNeedBe: string[]; no: string[] };
};

type DateGroup<T extends Option> = {
  id: string;
  key: string;
  parts: { weekday: string; day: string; month: string; year: string };
  options: T[];
};

/**
 * Consecutive options that share a month or a day. Sorted by popularity, the
 * same day can head more than one group, so each is keyed by its first option.
 */
function groupOptions<T extends Option>(
  options: T[],
  {
    by,
    floating,
    locale,
    timeZone,
  }: {
    by: "month" | "day";
    floating: boolean;
    locale: string;
    timeZone: string | null | undefined;
  },
) {
  const groups: DateGroup<T>[] = [];
  for (const option of options) {
    const parts = formatDateParts(option.startTime, {
      locale,
      timeZone: optionZone(option, floating).timeZone ?? timeZone ?? "UTC",
    });
    const key =
      by === "month"
        ? `${parts.year}-${parts.month}`
        : `${parts.year}-${parts.month}-${parts.day}`;
    const last = groups.at(-1);
    if (last?.key === key) {
      last.options.push(option);
    } else {
      groups.push({ id: option.id, key, parts, options: [option] });
    }
  }
  return groups;
}

function useDateGroups<T extends Option>(
  options: T[],
  { floating, by }: { floating: boolean; by: "month" | "day" },
) {
  const { locale, timeZone } = useDateTimeConfig();
  return groupOptions(options, { by, floating, locale, timeZone });
}

/** The year only earns its place when the options span more than one. */
function spansYears(groups: DateGroup<Option>[]) {
  return new Set(groups.map((group) => group.parts.year)).size > 1;
}

/**
 * One row per option, grouped by month and, when the poll has times, by day,
 * matching the table's headings. Each group's label sits to the left of its
 * first row, and every row shares one grid so dates, times and bars line up.
 */
function ResultsList({
  options,
  participants,
  floating,
  hasTimes,
  showEndTime,
  best,
  onPick,
}: {
  options: TableOption[];
  participants: Participant[];
  floating: boolean;
  hasTimes: boolean;
  showEndTime: boolean;
  best: number;
  onPick?: (option: TableOption) => void;
}) {
  const { locale, timeZone } = useDateTimeConfig();
  const months = useDateGroups(options, { floating, by: "month" });
  const showYear = spansYears(months);
  const total = participants.length;

  const row = (option: TableOption) => {
    const yes = option.votes.yes.length;
    const ifNeedBe = option.votes.ifNeedBe.length;
    return (
      <li
        key={option.id}
        className="col-span-full grid min-h-16 grid-cols-subgrid items-center border-button-outline border-b py-4 last:border-b-0"
      >
        {hasTimes ? (
          <OptionTime
            option={option}
            floating={floating}
            showEnd={showEndTime}
          />
        ) : (
          <OptionDay option={option} floating={floating} />
        )}
        <AvailabilityBar yes={yes} ifNeedBe={ifNeedBe} total={total} />
        <AvailabilityPopover
          option={option}
          participants={participants}
          floating={floating}
          highlight={best > 0 && yes + ifNeedBe === best}
          onFinalize={onPick ? () => onPick(option) : undefined}
        />
      </li>
    );
  };

  return (
    <ol
      className="grid gap-x-6 text-sm"
      style={{
        gridTemplateColumns: [
          // Month, then the day.
          "auto",
          "auto",
          ...(showEndTime
            ? ["auto", "auto", "auto"]
            : hasTimes
              ? ["auto"]
              : []),
          "minmax(3rem,1fr)",
          "auto",
        ].join(" "),
      }}
    >
      {months.map((month) => (
        <li
          key={month.id}
          className="col-span-full grid grid-cols-subgrid border-button-outline border-b px-5 last:border-b-0"
        >
          {/* Level with the group's first option. */}
          <div className="flex h-16 items-center">
            <MonthLabel
              month={month.parts.month}
              year={showYear ? month.parts.year : undefined}
            />
          </div>
          <ol className="col-[2/-1] grid grid-cols-subgrid">
            {hasTimes
              ? groupOptions(month.options, {
                  by: "day",
                  floating,
                  locale,
                  timeZone,
                }).map((day) => (
                  <li
                    key={day.id}
                    className="col-span-full grid grid-cols-subgrid border-button-outline border-b last:border-b-0"
                  >
                    <div className="flex h-16 items-center">
                      <DayLabel
                        weekday={day.parts.weekday}
                        day={day.parts.day}
                      />
                    </div>
                    <ol className="col-[2/-1] grid grid-cols-subgrid">
                      {day.options.map(row)}
                    </ol>
                  </li>
                ))
              : month.options.map(row)}
          </ol>
        </li>
      ))}
    </ol>
  );
}

type TableProps = {
  options: TableOption[];
  participants: Participant[];
  floating: boolean;
  hasTimes: boolean;
  best: number;
};

function availableCount(option: TableOption) {
  return option.votes.yes.length + option.votes.ifNeedBe.length;
}

function votesByOption(participant: Participant) {
  return new Map(participant.votes.map((vote) => [vote.optionId, vote.type]));
}

/**
 * The participant's avatar, with the name beside it when expanded. Opens a
 * menu with their note, when and how they responded, and their actions.
 */
function ParticipantCell({
  participant,
  expanded,
}: {
  participant: Participant;
  expanded: boolean;
}) {
  const { t } = useTranslation();
  const deleteDialog = useDialog();
  const hasNote = Boolean(participant.note);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className={cn(
                "-mx-1.5 -my-1 flex min-w-0 items-center gap-2 rounded-control-sm px-1.5 py-1 text-start hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-primary data-popup-open:bg-foreground/5",
                // Fills the cell, so a long name truncates inside the column
                // instead of running past its edge.
                expanded && "w-[calc(100%+0.75rem)]",
              )}
              aria-label={
                expanded
                  ? undefined
                  : hasNote
                    ? t("pollResultsParticipantWithNote", {
                        defaultValue: "{name}, left a note",
                        name: participant.name,
                      })
                    : participant.name
              }
            />
          }
        >
          <span className="relative inline-flex shrink-0">
            <OptimizedAvatarImage
              size="sm"
              name={participant.name}
              src={participant.image ?? undefined}
            />
          </span>
          {expanded ? (
            <>
              <span className="min-w-0 truncate">{participant.name}</span>
              {hasNote ? (
                <MessageSquareTextIcon
                  aria-label={t("pollResultsLeftNote", {
                    defaultValue: "Left a note",
                  })}
                  className="size-3.5 shrink-0 text-muted-foreground"
                />
              ) : null}
            </>
          ) : null}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <div className="flex flex-col gap-3 p-2">
            <div className="flex items-center gap-2.5">
              <OptimizedAvatarImage
                size="md"
                name={participant.name}
                src={participant.image ?? undefined}
              />
              <div className="min-w-0">
                <p className="truncate font-medium text-sm">
                  {participant.name}
                </p>
                <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  {participant.viaInvite ? (
                    <Trans
                      i18nKey="overviewViaInvite"
                      defaults="Email invite"
                    />
                  ) : (
                    <Trans i18nKey="overviewViaLink" defaults="Shared link" />
                  )}
                  <span aria-hidden="true">·</span>
                  <RelativeTime value={participant.respondedAt} />
                </p>
              </div>
            </div>
            {participant.note ? (
              <div className="text-sm">
                <ChatBubble>{participant.note}</ChatBubble>
              </div>
            ) : null}
          </div>
          <DropdownMenuSeparator />
          <CopyEditLinkMenuItem
            editUrl={participant.editUrl}
            participantName={participant.name}
          />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => deleteDialog.trigger()}
          >
            <TrashIcon />
            <Trans i18nKey="delete" defaults="Delete" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteParticipantModal
        {...deleteDialog.dialogProps}
        participantId={participant.id}
        participantName={participant.name}
      />
    </>
  );
}

/** Shows or hides names in the participant column. */
function ExpandNamesButton({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const label = expanded
    ? t("pollResultsTableHideNames", { defaultValue: "Hide names" })
    : t("pollResultsTableShowNames", { defaultValue: "Show names" });
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={label}
            aria-pressed={expanded}
            onClick={onToggle}
          />
        }
      >
        {expanded ? (
          <ChevronsLeftIcon aria-hidden="true" />
        ) : (
          <ChevronsRightIcon aria-hidden="true" />
        )}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Everyone's answer to every option as a grid: participants down the side,
 * options across the top in the current sort order, the best columns tinted.
 * Runs edge to edge in its section and scrolls sideways with names pinned.
 */
function ResultsTable({
  options,
  participants,
  floating,
  best,
  showDuration,
  onPick,
}: TableProps & {
  /** Only when options differ in length; a shared one is in the details. */
  showDuration: boolean;
  /** Omitted once a date can no longer be picked. */
  onPick?: (option: TableOption) => void;
}) {
  const { formatDateTime } = useDateTime();
  const { locale, timeZone } = useDateTimeConfig();
  // The column under the pointer is highlighted top to bottom.
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const [namesExpanded, setNamesExpanded] = React.useState(false);
  // Month headings span the consecutive options they share.
  const monthGroups = useDateGroups(options, { floating, by: "month" });
  const showYear = spansYears(monthGroups);
  return (
    <div className="relative overflow-x-auto overscroll-x-none">
      <table
        onMouseLeave={() => setHoveredId(null)}
        className="w-full border-separate border-spacing-0 text-sm [&_tbody_tr:last-child>*]:border-b-0 [&_td]:border-button-outline [&_th]:border-button-outline [&_th]:font-normal"
      >
        <thead>
          <tr>
            <th
              rowSpan={2}
              className={cn(
                "sticky left-0 z-10 w-px border-r border-b bg-gray-50 px-3 pb-3 align-bottom dark:bg-[color-mix(in_oklab,var(--color-foreground)_3%,var(--color-background))]",
                namesExpanded ? "text-end" : "text-center",
              )}
            >
              {participants.length > 0 ? (
                <ExpandNamesButton
                  expanded={namesExpanded}
                  onToggle={() => setNamesExpanded((value) => !value)}
                />
              ) : null}
            </th>
            {monthGroups.map((group) => (
              <th
                key={group.id}
                scope="colgroup"
                colSpan={group.options.length}
                className="h-11 border-r border-b px-3 text-start last:border-r-0"
              >
                <MonthLabel
                  month={group.parts.month}
                  year={showYear ? group.parts.year : undefined}
                />
              </th>
            ))}
          </tr>
          <tr>
            {options.map((option) => {
              const zone = optionZone(option, floating).timeZone ?? timeZone;
              const end = new Date(
                option.startTime.getTime() + option.duration * 60_000,
              );
              const { weekday, day } = formatDateParts(option.startTime, {
                locale,
                timeZone: zone ?? "UTC",
              });
              return (
                <th
                  key={option.id}
                  scope="col"
                  onMouseEnter={() => setHoveredId(option.id)}
                  className={cn(
                    "min-w-20 border-r border-b px-3 pt-3 pb-4 align-top last:border-r-0",
                    hoveredId === option.id &&
                      "bg-foreground/[0.04] dark:bg-foreground/[0.02]",
                  )}
                >
                  <span className="flex flex-col items-center gap-1">
                    <DayLabel weekday={weekday} day={day} />
                    {option.duration > 0 ? (
                      <span className="flex flex-col items-center gap-1 whitespace-nowrap text-xs tabular-nums">
                        <span>
                          {formatDateTime(option.startTime, "time", {
                            timeZone: zone,
                          })}
                        </span>
                        {showDuration ? (
                          <Tooltip>
                            <TooltipTrigger
                              delay={0}
                              className="flex items-center gap-x-1 text-muted-foreground text-xs"
                            >
                              <ClockIcon
                                aria-hidden="true"
                                className="size-3"
                              />
                              {formatDuration(option.duration, locale)}
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">
                              {formatDateTime(option.startTime, "time", {
                                timeZone: zone,
                              })}
                              {" - "}
                              {formatDateTime(end, "time", {
                                timeZone: zone,
                              })}
                            </TooltipContent>
                          </Tooltip>
                        ) : null}
                      </span>
                    ) : null}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {participants.length === 0 ? (
            <tr>
              <th
                scope="row"
                className="sticky left-0 z-10 border-r bg-gray-50 px-5 py-3 dark:bg-[color-mix(in_oklab,var(--color-foreground)_3%,var(--color-background))]"
              >
                <span className="inline-block size-5" />
              </th>
              <td colSpan={options.length} className="px-5 py-10">
                <EmptyState>
                  <EmptyStateIcon>
                    <UsersIcon />
                  </EmptyStateIcon>
                  <EmptyStateTitle>
                    <Trans
                      i18nKey="pollResultsTableEmpty"
                      defaults="No responses yet"
                    />
                  </EmptyStateTitle>
                  <EmptyStateDescription>
                    <Trans
                      i18nKey="pollResultsTableEmptyDescription"
                      defaults="Share the poll to start collecting responses."
                    />
                  </EmptyStateDescription>
                </EmptyState>
              </td>
            </tr>
          ) : null}
          {participants.map((participant) => {
            const votes = votesByOption(participant);
            return (
              // The row under the pointer is highlighted across, as the
              // column is down.
              <tr key={participant.id} className="group/row">
                <th
                  scope="row"
                  className={cn(
                    "sticky left-0 z-10 border-r border-b bg-gray-50 px-5 py-3 text-start font-normal group-hover/row:bg-gray-100 dark:bg-[color-mix(in_oklab,var(--color-foreground)_3%,var(--color-background))] dark:group-hover/row:bg-[color-mix(in_oklab,var(--color-foreground)_5%,var(--color-background))]",
                    namesExpanded && "w-48 max-w-48",
                  )}
                >
                  <ParticipantCell
                    participant={participant}
                    expanded={namesExpanded}
                  />
                </th>
                {options.map((option) => {
                  return (
                    <td
                      key={option.id}
                      onMouseEnter={() => setHoveredId(option.id)}
                      className={cn(
                        "border-r border-b text-center last:border-r-0 group-hover/row:bg-foreground/[0.04] dark:group-hover/row:bg-foreground/[0.02]",
                        hoveredId === option.id &&
                          "bg-foreground/[0.04] dark:bg-foreground/[0.02]",
                      )}
                    >
                      <span className="inline-flex">
                        <VoteIcon
                          type={votes.get(option.id)}
                          round={true}
                          className="size-4"
                        />
                      </span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        {participants.length > 0 ? (
          <tfoot>
            <tr>
              <th
                scope="row"
                className="sticky left-0 z-10 border-t border-r bg-gray-50 px-5 py-2.5 text-start font-normal text-muted-foreground dark:bg-[color-mix(in_oklab,var(--color-foreground)_3%,var(--color-background))]"
              >
                <span className="sr-only">
                  <Trans
                    i18nKey="pollResultsTableAvailable"
                    defaults="Available"
                  />
                </span>
              </th>
              {options.map((option) => {
                const isBest = best > 0 && availableCount(option) === best;
                return (
                  <td
                    key={option.id}
                    onMouseEnter={() => setHoveredId(option.id)}
                    className={cn(
                      "border-t border-r px-2 py-3 last:border-r-0",
                      hoveredId === option.id &&
                        "bg-foreground/[0.04] dark:bg-foreground/[0.02]",
                    )}
                  >
                    <span className="flex flex-col items-center gap-1">
                      {participants.length > 0 ? (
                        <AvailabilityPopover
                          option={option}
                          participants={participants}
                          floating={floating}
                          highlight={isBest}
                          onFinalize={onPick ? () => onPick(option) : undefined}
                        />
                      ) : null}
                    </span>
                  </td>
                );
              })}
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}

function ExportCsvButton() {
  const { t } = useTranslation();
  const { exportToCsv } = useCsvExporter();
  const label = t("exportToCsv", { defaultValue: "Export to CSV" });
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={label}
            onClick={exportToCsv}
          />
        }
      >
        <DownloadIcon aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
