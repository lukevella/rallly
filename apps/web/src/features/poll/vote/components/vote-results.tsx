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
import { User2Icon } from "lucide-react";
import * as React from "react";
import VoteIcon from "@/features/poll/components/vote-icon";
import { VoteSegmentedControl } from "@/features/poll/components/vote-segmented-control";
import type { VoteType } from "@/features/poll/constants";
import { useVoteForm } from "@/features/poll/vote/components/vote-form";
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
    <span className="inline-flex items-center justify-center">
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

function Score({
  score,
  allowTentativeVotes,
}: {
  score: VoteResult["score"];
  allowTentativeVotes: boolean;
}) {
  const { t } = useTranslation();
  if (!score) {
    return null;
  }
  const total = score.yes + score.ifNeedBe;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-muted-foreground text-sm"
      title={
        allowTentativeVotes
          ? t("optionVoteBreakdown", {
              defaultValue: "{yesScore} yes, {ifNeedBeScore} if need be",
              yesScore: score.yes,
              ifNeedBeScore: score.ifNeedBe,
            })
          : t("optionVoteBreakdownYesOnly", {
              defaultValue: "{yesScore} yes",
              yesScore: score.yes,
            })
      }
    >
      <User2Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="tabular-nums">{total}</span>
      {score.ifNeedBe > 0 ? (
        <span
          className="size-1.5 rounded-full bg-amber-400"
          aria-hidden="true"
        />
      ) : null}
      <span className="sr-only">
        {allowTentativeVotes
          ? t("optionVoteBreakdown", {
              defaultValue: "{yesScore} yes, {ifNeedBeScore} if need be",
              yesScore: score.yes,
              ifNeedBeScore: score.ifNeedBe,
            })
          : t("optionVoteBreakdownYesOnly", {
              defaultValue: "{yesScore} yes",
              yesScore: score.yes,
            })}
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
  response,
  canVote,
}: {
  poll: VotePageView["poll"];
  results: VoteResult[];
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
          formatDateTime(
            result.startTime,
            isTimeSlot ? "dateFull" : "monthYear",
            { timeZone: readZone },
          ),
        {
          id: "group",
          cell: ({ row }) =>
            isTimeSlot ? (
              <EventDate
                value={row.original.startTime}
                allDay={false}
                timeZone={poll.timeZone}
                preset="dateFull"
              />
            ) : (
              <CalendarDate value={row.original.startTime} preset="monthYear" />
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
            <CalendarDate value={row.original.startTime} preset="weekdayDay" />
          ),
      }),
      columnHelper.display({
        id: "votes",
        header: () => <Trans i18nKey="votes" defaults="Votes" />,
        cell: ({ row }) => (
          <Score
            score={row.original.score}
            allowTentativeVotes={poll.allowTentativeVotes}
          />
        ),
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
    <div className="scrollbar-thin dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500 scrollbar-thumb-gray-300 scrollbar-track-transparent min-h-0 flex-1 overflow-y-auto [scroll-padding-top:3rem]">
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
          return (
            <div key={groupRow.id} role="rowgroup" aria-labelledby={id}>
              {/* The heading's row is what sticks: a sticky element can
                  only travel within its containing block, and the row is
                  no taller than the heading itself. */}
              <div role="row" className="sticky top-0 z-[5]">
                <div
                  id={id}
                  role="rowheader"
                  aria-colspan={visibleColumnCount}
                  // Solid background so rows do not show through.
                  className="border-b bg-muted px-4 py-2 font-medium"
                >
                  {groupCell
                    ? flexRender(
                        groupCell.column.columnDef.cell,
                        groupCell.getContext(),
                      )
                    : null}
                </div>
              </div>
              {groupRow.subRows.map((row) => (
                <div
                  key={row.id}
                  role="row"
                  data-testid="poll-option"
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-b px-4 py-2"
                >
                  {row.getVisibleCells().map((cell) => (
                    <div
                      key={cell.id}
                      role="cell"
                      className={
                        cell.column.id === "option"
                          ? "whitespace-nowrap"
                          : "justify-self-end"
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
