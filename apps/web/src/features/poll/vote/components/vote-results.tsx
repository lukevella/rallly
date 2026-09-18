/** biome-ignore-all lint/a11y/useSemanticElements: ARIA table on divs so rows can be CSS grids; table elements lose their semantics under display: grid in Chrome and Safari */
/** biome-ignore-all lint/a11y/useFocusableInteractive: row and header roles are only interactive inside role="grid", not role="table" */
"use client";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getGroupedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";
import VoteIcon from "@/features/poll/components/vote-icon";
import { VoteSegmentedControl } from "@/features/poll/components/vote-segmented-control";
import type { VoteType } from "@/features/poll/constants";
import { OptionDate } from "@/features/poll/vote/components/option-date";
import { useVoteForm } from "@/features/poll/vote/components/vote-form";
import { VoteProgress } from "@/features/poll/vote/components/vote-progress";
import type { VotePageView, VoteResult } from "@/features/poll/vote/types";
import {
  EventDate,
  EventTimeRange,
} from "@/features/scheduled-event/components/event-date-time";
import { Trans, useTranslation } from "@/i18n/client";
import { CalendarDate } from "@/lib/datetime/calendar-date";
import { useDateTime } from "@/lib/datetime/client";

/** A recorded vote: icon only, with the vote type for screen readers. */
function VoteLabel({ type }: { type?: VoteType }) {
  return (
    // flex rather than inline-flex: an inline box sits on the text
    // baseline, which leaves the icon a few pixels above the row's centre.
    <span className="flex items-center justify-center">
      <VoteIcon type={type} />
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

const columnHelper = createColumnHelper<VoteResult>();

// Stable references: TanStack recomputes the grouped model whenever these
// change identity; fresh objects each render freeze the page on the first
// pointer press.
const tableState = {
  grouping: ["group"],
  columnVisibility: { group: false },
};

const endOf = (result: VoteResult) =>
  new Date(result.startTime.getTime() + result.duration * 60_000);

function VoteCell({
  optionId,
  optionLabel,
  index,
  allowTentativeVotes,
  savedVote,
  canVote,
}: {
  optionId: string;
  optionLabel: string;
  index: number;
  allowTentativeVotes: boolean;
  savedVote?: VoteType;
  canVote: boolean;
}) {
  const form = useVoteForm();
  const mode = form.watch("mode");
  const votes = form.watch("votes");

  if (!canVote || mode === "view") {
    return savedVote !== undefined ? <VoteLabel type={savedVote} /> : null;
  }
  return (
    <VoteSegmentedControl
      value={votes[index]?.type}
      onChange={(newVote) => {
        const next = [...votes];
        next[index] = { optionId, type: newVote };
        form.setValue("votes", next, { shouldDirty: true });
      }}
      optionLabel={optionLabel}
      allowTentativeVotes={allowTentativeVotes}
    />
  );
}

/**
 * The options as a table grouped by day (time polls) or month (date polls),
 * with the viewer's vote control on each row.
 */
export function VoteResults({
  poll,
  results,
  participantCount,
  response,
  canVote,
}: {
  poll: VotePageView["poll"];
  results: VoteResult[];
  participantCount: number | null;
  response: VotePageView["response"];
  canVote: boolean;
}) {
  const { formatDateTime, formatDateTimeRange } = useDateTime();
  const { t } = useTranslation();
  const headingId = React.useId();

  const isTimeSlot = (results[0]?.duration ?? 0) > 0;
  // All-day dates and floating times are stored as UTC wall time and read
  // back in UTC; a zoned time poll is read in the viewer's zone.
  const readZone = isTimeSlot && poll.timeZone ? undefined : "UTC";

  const savedVotes = React.useMemo(() => {
    const map = new Map<string, VoteType>();
    for (const vote of response?.votes ?? []) {
      map.set(vote.optionId, vote.type);
    }
    return map;
  }, [response]);

  const columns = React.useMemo(
    () => [
      columnHelper.accessor(
        (result) =>
          formatDateTime(result.startTime, isTimeSlot ? "dateFull" : "year", {
            timeZone: readZone,
          }),
        {
          id: "group",
          cell: ({ row }) =>
            isTimeSlot ? (
              <EventDate
                value={row.original.startTime}
                allDay={false}
                timeZone={poll.timeZone}
                preset="weekdayMonthDayShort"
              />
            ) : (
              <CalendarDate value={row.original.startTime} preset="year" />
            ),
        },
      ),
      columnHelper.display({
        id: "option",
        header: () =>
          isTimeSlot ? (
            <Trans i18nKey="time" defaults="Time" />
          ) : (
            <Trans i18nKey="date" defaults="Date" />
          ),
        cell: ({ row }) =>
          isTimeSlot ? (
            <EventTimeRange
              start={row.original.startTime}
              end={endOf(row.original)}
              allDay={false}
              timeZone={poll.timeZone}
            />
          ) : (
            <OptionDate value={row.original.startTime} />
          ),
      }),
      columnHelper.display({
        id: "votes",
        header: () => <Trans i18nKey="votes" defaults="Votes" />,
        cell: ({ row }) => {
          const score = row.original.score;
          if (!score || participantCount === null) {
            return null;
          }
          return (
            <VoteProgress
              score={score}
              participantCount={participantCount}
              allowTentativeVotes={poll.allowTentativeVotes}
            />
          );
        },
      }),
      columnHelper.display({
        id: "vote",
        header: () => <Trans i18nKey="yourVote" defaults="Your vote" />,
        cell: ({ row }) => {
          const result = row.original;
          const optionLabel = isTimeSlot
            ? `${row.getValue<string>("group")}, ${formatDateTimeRange(
                result.startTime,
                endOf(result),
                "time",
                { timeZone: readZone },
              )}`
            : formatDateTime(result.startTime, "dateFull", { timeZone: "UTC" });
          return (
            <VoteCell
              optionId={result.optionId}
              optionLabel={optionLabel}
              index={results.findIndex((r) => r.optionId === result.optionId)}
              allowTentativeVotes={poll.allowTentativeVotes}
              savedVote={savedVotes.get(result.optionId)}
              canVote={canVote}
            />
          );
        },
      }),
    ],
    [
      canVote,
      participantCount,
      formatDateTime,
      formatDateTimeRange,
      isTimeSlot,
      poll.allowTentativeVotes,
      poll.timeZone,
      readZone,
      results,
      savedVotes,
    ],
  );

  const table = useReactTable({
    data: results,
    columns,
    getRowId: (result) => result.optionId,
    state: tableState,
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
  });

  const visibleColumnCount = table.getVisibleLeafColumns().length;

  return (
    // The scroll area. Scroll padding keeps a focused row clear of the
    // pinned group heading.
    // `relative` makes this the containing block for the sticky group
    // headings; without it they propagate their height to the root element
    // and the whole page gains a scrollbar.
    // Only the results scroll, and only from lg: below that the page scrolls,
    // so the list grows to its natural height and the phone scrolls as one.
    <div className="lg:scrollbar-thin dark:lg:scrollbar-thumb-gray-600 dark:lg:scrollbar-track-gray-800 hover:lg:scrollbar-thumb-gray-400 dark:hover:lg:scrollbar-thumb-gray-500 lg:scrollbar-thumb-gray-300 lg:scrollbar-track-transparent relative flex-1 lg:min-h-0 lg:overflow-y-auto lg:[scroll-padding-top:3rem]">
      <div
        role="table"
        aria-label={t("pollOptions", { defaultValue: "Poll options" })}
        aria-colcount={visibleColumnCount}
        className="text-sm"
      >
        <div role="rowgroup" className="sr-only">
          {table.getHeaderGroups().map((headerGroup) => (
            <div key={headerGroup.id} role="row">
              {headerGroup.headers.map((header) => (
                <div key={header.id} role="columnheader">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        {table.getGroupedRowModel().rows.map((groupRow, groupIndex) => {
          const id = `${headingId}-${groupIndex}`;
          const groupCell = groupRow
            .getAllCells()
            .find((cell) => cell.column.id === "group");
          const heading = groupCell
            ? flexRender(
                groupCell.column.columnDef.cell,
                groupCell.getContext(),
              )
            : null;

          const rows = groupRow.subRows.map((row) => (
            <div
              key={row.id}
              role="row"
              data-testid="poll-option"
              className={
                isTimeSlot
                  ? "col-span-2 grid h-16 grid-cols-subgrid items-center gap-x-4 border-b px-4 sm:col-span-3 sm:pl-0"
                  : // The date spans two of the group's columns, so the
                    // weekday and the month/day each line up down the list.
                    "col-span-3 grid h-16 grid-cols-subgrid items-center gap-x-4 border-b px-4 sm:col-span-4 sm:pl-0"
              }
            >
              {row.getVisibleCells().map((cell) => (
                <div
                  key={cell.id}
                  role="cell"
                  className={
                    cell.column.id === "option"
                      ? isTimeSlot
                        ? "truncate"
                        : "grid grid-cols-subgrid truncate [grid-column:span_2]"
                      : cell.column.id === "votes"
                        ? // The vote control needs the width on a narrow
                          // screen, and the bar is what can go.
                          "hidden justify-self-end sm:block"
                        : "justify-self-end"
                  }
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              ))}
            </div>
          ));

          // Both poll types put their heading in a gutter beside the rows
          // it covers: a year for date polls, the day for time polls. The
          // group owns the column tracks and its rows subgrid onto them,
          // so the columns line up down the whole group.
          return (
            <div
              key={groupRow.id}
              role="rowgroup"
              aria-labelledby={id}
              // Below sm the heading takes a line of its own above its
              // rows: a gutter would leave the rows too little width.
              className={
                isTimeSlot
                  ? "grid sm:grid-cols-[8rem_1fr_auto_auto]"
                  : "grid sm:grid-cols-[6rem_auto_1fr_auto_auto]"
              }
            >
              <div
                id={id}
                role="rowheader"
                // Sticks while any of its rows is in view, then the next
                // group's heading pushes it out. The row's own border-b
                // sits above its py-2, so the heading needs a little more
                // top padding to share the first row's baseline.
                // The rows are a fixed height with centred content, so the
                // heading is padded to sit on the first row's baseline.
                className="sticky top-14 z-10 self-start border-b bg-card px-4 pt-3 pb-2 text-muted-foreground tabular-nums sm:border-b-0 sm:pt-[1.375rem] sm:pr-4 sm:pl-4 lg:top-0"
              >
                {heading}
              </div>
              <div
                className={
                  isTimeSlot
                    ? "grid grid-cols-[minmax(0,1fr)_auto] sm:col-span-3 sm:grid-cols-subgrid"
                    : "grid grid-cols-[auto_minmax(0,1fr)_auto] sm:col-span-4 sm:grid-cols-subgrid"
                }
              >
                {rows}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
