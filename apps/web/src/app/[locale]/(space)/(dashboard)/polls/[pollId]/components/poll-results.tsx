"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@rallly/ui/popover";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@rallly/ui/segmented-control";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import {
  ChevronDownIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ClockIcon,
  DownloadIcon,
  ListIcon,
  StarIcon,
  Table2Icon,
} from "lucide-react";
import React from "react";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { FinalizePollDialog } from "@/features/poll/components/finalize-poll-dialog";
import { useCsvExporter } from "@/features/poll/components/manage-poll/use-csv-exporter";
import VoteIcon from "@/features/poll/components/vote-icon";
import type { VoteType } from "@/features/poll/constants";
import { rankOptionsByPopularity } from "@/features/poll/utils";
import { Trans, useTranslation } from "@/i18n/client";
import { useDateTime, useDateTimeConfig } from "@/lib/datetime/client";
import { formatDateParts, formatDuration } from "@/lib/datetime/format";
import { PollSection, PollSectionEmpty } from "./poll-section";

type Option = { id: string; startTime: Date; duration: number };
type Participant = {
  id: string;
  name: string;
  image: string | null;
  votes: { optionId: string; type: VoteType }[];
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
  // A table stays readable with a handful of columns; past that the list scans
  // better.
  const [view, setView] = React.useState<View>(() =>
    options.length < 10 ? "table" : "list",
  );
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
        <div className="flex items-center gap-2">
          {rows.length > 0 ? <ExportCsvButton /> : null}
          {rows.length > 0 && participants.length > 0 ? (
            <SegmentedControl
              aria-label={t("pollResultsView", { defaultValue: "View" })}
              value={view}
              onValueChange={(value) => setView(value as View)}
            >
              <SegmentedControlItem
                value="list"
                className="px-2"
                aria-label={t("pollResultsViewList", { defaultValue: "List" })}
              >
                <ListIcon aria-hidden="true" className="size-4" />
              </SegmentedControlItem>
              <SegmentedControlItem
                value="table"
                className="px-2"
                aria-label={t("pollResultsViewTable", {
                  defaultValue: "Table",
                })}
              >
                <Table2Icon aria-hidden="true" className="size-4" />
              </SegmentedControlItem>
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
      ) : view === "table" && participants.length > 0 ? (
        <ResultsTable
          options={rows}
          participants={participants}
          floating={timeZone === null}
          hasTimes={hasTimes}
          best={best}
          showDuration={showEndTime}
          pickLabel={
            canPick
              ? (option) =>
                  t("pollResultsPick", {
                    defaultValue: "Pick {date}",
                    date: formatDateTime(
                      option.startTime,
                      "weekdayMonthDay",
                      optionZone(option, timeZone === null),
                    ),
                  })
              : undefined
          }
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
          pickLabel={
            canPick
              ? (option) =>
                  t("pollResultsPick", {
                    defaultValue: "Pick {date}",
                    date: formatDateTime(
                      option.startTime,
                      "weekdayMonthDay",
                      optionZone(option, timeZone === null),
                    ),
                  })
              : undefined
          }
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
      {canPick ? (
        <FinalizePollDialog
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
      <p className="text-muted-foreground">
        <Trans i18nKey="pollResultsNoVotes" defaults="No one has voted yet." />
      </p>
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

  return (
    <div className="@container">
      <div className="grid @md:grid-cols-2 gap-6">
        <BreakdownList
          entries={available}
          participantsById={participantsById}
        />
        <BreakdownList
          entries={unavailable}
          participantsById={participantsById}
        />
      </div>
    </div>
  );
}

function BreakdownList({
  entries,
  participantsById,
}: {
  entries: { id: string; type?: VoteType }[];
  participantsById: Map<string, Participant>;
}) {
  if (entries.length === 0) {
    return null;
  }
  return (
    <ul className="flex flex-col gap-2.5">
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

function PickButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            onClick={onClick}
          />
        }
      >
        <StarIcon aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>
        <Trans i18nKey="pollResultsPickTooltip" defaults="Pick this date" />
      </TooltipContent>
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
      className="ms-auto flex h-1.5 w-full max-w-48 overflow-hidden rounded-full bg-foreground/10"
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
}: {
  option: Option & {
    votes: { yes: string[]; ifNeedBe: string[]; no: string[] };
  };
  participants: Participant[];
  floating: boolean;
  highlight: boolean;
}) {
  const { formatDateTime } = useDateTime();
  const count = option.votes.yes.length + option.votes.ifNeedBe.length;
  const participantsById = React.useMemo(
    () =>
      new Map(participants.map((participant) => [participant.id, participant])),
    [participants],
  );
  const zone = optionZone(option, floating);
  return (
    <Popover>
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
        <span aria-hidden="true">
          {count}
          <span className="text-muted-foreground text-xs">
            /{participants.length}
          </span>
        </span>
        <span className="sr-only">
          <Trans
            i18nKey="pollResultsAvailableCount"
            defaults="{count} of {total} available"
            values={{ count, total: participants.length }}
          />
        </span>
        <ChevronDownIcon aria-hidden="true" className="size-3.5 opacity-60" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-4">
        <div>
          <p className="font-medium">
            {formatDateTime(option.startTime, "weekdayMonthDay", zone)}
          </p>
          {option.duration > 0 ? (
            <p className="text-muted-foreground tabular-nums">
              {formatDateTime(option.startTime, "time", zone)}
              {" – "}
              {formatDateTime(
                new Date(option.startTime.getTime() + option.duration * 60_000),
                "time",
                zone,
              )}
            </p>
          ) : null}
        </div>
        <VoteBreakdown
          optionId={option.id}
          votes={option.votes}
          participants={participants}
          participantsById={participantsById}
        />
      </PopoverContent>
    </Popover>
  );
}

// All-day dates and floating times are stored as UTC wall time.
function optionZone(option: Option, floating: boolean) {
  return option.duration === 0 || floating ? { timeZone: "UTC" } : {};
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
  return (
    <>
      <span className="text-muted-foreground">{weekday}</span>
      <span className="text-end tabular-nums">{day}</span>
    </>
  );
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
      <span className="whitespace-nowrap text-end text-muted-foreground tabular-nums">
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
      <span className="text-end">
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
  pickLabel,
  onPick,
}: {
  options: TableOption[];
  participants: Participant[];
  floating: boolean;
  hasTimes: boolean;
  showEndTime: boolean;
  best: number;
  pickLabel?: (option: TableOption) => string;
  onPick?: (option: TableOption) => void;
}) {
  const { locale, timeZone } = useDateTimeConfig();
  const months = useDateGroups(options, { floating, by: "month" });
  const showYear = spansYears(months);
  const total = participants.length;

  const row = (option: TableOption) => {
    const yes = option.votes.yes.length;
    const ifNeedBe = option.votes.ifNeedBe.length;
    const label = pickLabel?.(option);
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
        />
        {onPick && label ? (
          <span>
            <PickButton label={label} onClick={() => onPick(option)} />
          </span>
        ) : null}
      </li>
    );
  };

  return (
    <ol
      className="grid gap-x-6 text-sm"
      style={{
        gridTemplateColumns: [
          // Month, then the day (with times) or weekday and day number.
          "auto",
          ...(hasTimes ? ["auto"] : ["auto", "auto"]),
          ...(showEndTime
            ? ["auto", "auto", "auto"]
            : hasTimes
              ? ["auto"]
              : []),
          "minmax(3rem,1fr)",
          "auto",
          ...(onPick ? ["auto"] : []),
        ].join(" "),
      }}
    >
      {months.map((month) => (
        <li
          key={month.id}
          className="col-span-full grid grid-cols-subgrid border-button-outline border-b px-5 last:border-b-0"
        >
          {/* Level with the group's first option. */}
          <div className="flex h-16 items-center gap-1 whitespace-nowrap">
            <span>{month.parts.month}</span>
            {showYear ? (
              <span className="text-muted-foreground">{month.parts.year}</span>
            ) : null}
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
                    <div className="flex h-16 items-center gap-1.5 whitespace-nowrap">
                      <span className="text-muted-foreground">
                        {day.parts.weekday}
                      </span>
                      <span className="tabular-nums">{day.parts.day}</span>
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

/** The avatar, with the name beside it when expanded; otherwise as a tooltip. */
function ParticipantName({
  participant,
  expanded,
}: {
  participant: Participant;
  expanded: boolean;
}) {
  const avatar = (
    <OptimizedAvatarImage
      size="sm"
      name={participant.name}
      src={participant.image ?? undefined}
    />
  );
  if (expanded) {
    return (
      <span className="flex min-w-0 items-center gap-2">
        {avatar}
        <span className="min-w-0 truncate">{participant.name}</span>
      </span>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        {avatar}
        <span className="sr-only">{participant.name}</span>
      </TooltipTrigger>
      <TooltipContent>{participant.name}</TooltipContent>
    </Tooltip>
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
  hasTimes,
  best,
  pickLabel,
  onPick,
  showDuration,
}: TableProps & {
  /** Only when options differ in length; a shared one is in the details. */
  showDuration: boolean;
  /** Omitted once a date can no longer be picked. */
  pickLabel?: (option: TableOption) => string;
  onPick?: (option: TableOption) => void;
}) {
  const { formatDateTime } = useDateTime();
  const { locale, timeZone } = useDateTimeConfig();
  // The column under the pointer is highlighted top to bottom.
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const [namesExpanded, setNamesExpanded] = React.useState(false);
  // Month and day headings span the consecutive options they share, as on
  // the vote page's grid.
  const monthGroups = useDateGroups(options, { floating, by: "month" });
  const dayGroups = useDateGroups(options, { floating, by: "day" });
  const showYear = spansYears(monthGroups);
  return (
    <div className="relative overflow-x-auto">
      <table
        onMouseLeave={() => setHoveredId(null)}
        className="w-full border-separate border-spacing-0 text-sm [&_tbody_tr:last-child>*]:border-b-0 [&_td]:border-button-outline [&_th]:border-button-outline [&_th]:font-normal"
      >
        <thead>
          <tr>
            <th
              rowSpan={3}
              className={cn(
                "sticky left-0 z-10 w-px border-r border-b bg-gray-50 px-3 pb-3 align-bottom dark:bg-[color-mix(in_oklab,var(--color-foreground)_5%,var(--color-background))]",
                namesExpanded ? "text-end" : "text-center",
              )}
            >
              <ExpandNamesButton
                expanded={namesExpanded}
                onToggle={() => setNamesExpanded((value) => !value)}
              />
            </th>
            {monthGroups.map((group) => (
              <th
                key={group.id}
                scope="colgroup"
                colSpan={group.options.length}
                className="h-11 border-r border-b px-3 text-start last:border-r-0"
              >
                <span className="inline-flex gap-1">
                  <span>{group.parts.month}</span>
                  {showYear ? (
                    <span className="text-muted-foreground">
                      {group.parts.year}
                    </span>
                  ) : null}
                </span>
              </th>
            ))}
          </tr>
          <tr>
            {dayGroups.map((group) => (
              <th
                key={group.id}
                scope="colgroup"
                colSpan={group.options.length}
                className={cn(
                  "border-r pt-3 last:border-r-0",
                  "pb-1",
                  // A day with one option heads that column alone.
                  group.options.length === 1 &&
                    hoveredId === group.id &&
                    "bg-foreground/[0.04]",
                )}
              >
                {/* Centred over the first of the day's options, as on the vote page. */}
                <span
                  className="block text-center"
                  style={{ width: `calc(100% / ${group.options.length})` }}
                >
                  <span className="block font-normal text-muted-foreground text-xs">
                    {group.parts.weekday}
                  </span>
                  <span className="block">{group.parts.day}</span>
                </span>
              </th>
            ))}
          </tr>
          <tr>
            {options.map((option) => {
              const zone = optionZone(option, floating).timeZone ?? timeZone;
              const end = new Date(
                option.startTime.getTime() + option.duration * 60_000,
              );
              return (
                <th
                  key={option.id}
                  scope="col"
                  onMouseEnter={() => setHoveredId(option.id)}
                  className={cn(
                    "min-w-20 border-r border-b px-3 pt-2 pb-4 align-top font-normal last:border-r-0",
                    hoveredId === option.id && "bg-foreground/[0.04]",
                  )}
                >
                  <span className="flex flex-col items-center gap-1.5">
                    {hasTimes && option.duration > 0 ? (
                      <span className="flex flex-col items-center gap-1.5 text-muted-foreground text-xs">
                        <span>
                          {formatDateTime(option.startTime, "time", {
                            timeZone: zone,
                          })}
                        </span>
                        {showDuration ? (
                          <Tooltip>
                            <TooltipTrigger
                              delay={0}
                              className="flex items-center gap-x-1"
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
                    {onPick && pickLabel ? (
                      <PickButton
                        label={pickLabel(option)}
                        onClick={() => onPick(option)}
                      />
                    ) : null}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {participants.map((participant) => {
            const votes = votesByOption(participant);
            return (
              <tr key={participant.id}>
                <th
                  scope="row"
                  className={cn(
                    "sticky left-0 z-10 border-r border-b bg-gray-50 px-5 py-3 text-start font-normal dark:bg-[color-mix(in_oklab,var(--color-foreground)_5%,var(--color-background))]",
                    namesExpanded && "max-w-48",
                  )}
                >
                  <ParticipantName
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
                        "border-r border-b text-center last:border-r-0",
                        hoveredId === option.id && "bg-foreground/[0.04]",
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
        <tfoot>
          <tr>
            <th
              scope="row"
              className="sticky left-0 z-10 border-t border-r bg-gray-50 px-5 py-2.5 text-start font-normal text-muted-foreground dark:bg-[color-mix(in_oklab,var(--color-foreground)_5%,var(--color-background))]"
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
                    hoveredId === option.id && "bg-foreground/[0.04]",
                  )}
                >
                  <span className="flex justify-center">
                    <AvailabilityPopover
                      option={option}
                      participants={participants}
                      floating={floating}
                      highlight={isBest}
                    />
                  </span>
                </td>
              );
            })}
          </tr>
        </tfoot>
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
