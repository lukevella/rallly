"use client";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";
import { DataList } from "@/components/data-list";
import VoteIcon from "@/features/poll/components/vote-icon";
import { VoteSegmentedControl } from "@/features/poll/components/vote-segmented-control";
import type { VoteType } from "@/features/poll/constants";
import { OptionDate } from "@/features/poll/vote/components/option-date";
import {
  useVote,
  useVotesByOption,
} from "@/features/poll/vote/components/vote-form";
import { VoteScore } from "@/features/poll/vote/components/vote-score";
import type { VoteResult, VoteViewProps } from "@/features/poll/vote/types";
import { EventTimeRange } from "@/features/scheduled-event/components/event-date-time";
import { Trans } from "@/i18n/client";
import { CalendarDate } from "@/lib/datetime/calendar-date";
import { useDateTime } from "@/lib/datetime/client";
import {
  calendarDateToUTCMidnight,
  getCalendarDate,
} from "@/lib/datetime/utils";

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

const endOf = (result: VoteResult) =>
  new Date(result.startTime.getTime() + result.duration * 60_000);

function VoteCell({
  optionId,
  optionLabel,
  allowTentativeVotes,
  savedVote,
  canVote,
}: {
  optionId: string;
  optionLabel: string;
  allowTentativeVotes: boolean;
  savedVote?: VoteType;
  canVote: boolean;
}) {
  const { value, setVote, isEditing } = useVote(optionId);

  if (!canVote || !isEditing) {
    return savedVote !== undefined ? <VoteLabel type={savedVote} /> : null;
  }
  return (
    <VoteSegmentedControl
      value={value}
      onChange={setVote}
      optionLabel={optionLabel}
      allowTentativeVotes={allowTentativeVotes}
    />
  );
}

/**
 * The options as a list. A time poll groups them by day under the same
 * headings the events page uses; a date poll's rows each carry their own
 * full date, so they run flat.
 */
export function VoteViewList({
  poll,
  results,
  participantCount,
  response,
  canVote,
}: VoteViewProps) {
  const { formatDateTime, formatDateTimeRange } = useDateTime();

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
      columnHelper.display({
        id: "option",
        meta: { className: "text-sm" },
        cell: ({ row }) => (
          // DataList owns the row element, so the option cell carries the
          // handle tests use to find an option.
          <span data-testid="poll-option" className="truncate">
            {isTimeSlot ? (
              <EventTimeRange
                start={row.original.startTime}
                end={endOf(row.original)}
                allDay={false}
                timeZone={poll.timeZone}
              />
            ) : (
              <OptionDate value={row.original.startTime} />
            )}
          </span>
        ),
      }),
      columnHelper.display({
        id: "votes",
        // The vote control needs the width on a narrow screen, and the bar
        // is what can go.
        meta: { className: "hidden justify-end sm:flex" },
        cell: ({ row }) => (
          <VoteScore
            optionId={row.original.optionId}
            score={row.original.score}
            savedVote={savedVotes.get(row.original.optionId)}
            participantCount={participantCount}
            hasSavedResponse={response !== null}
            allowTentativeVotes={poll.allowTentativeVotes}
          />
        ),
      }),
      columnHelper.display({
        id: "vote",
        meta: { className: "justify-end" },
        cell: ({ row }) => {
          const result = row.original;
          const optionLabel = isTimeSlot
            ? `${formatDateTime(result.startTime, "dateFull", {
                timeZone: readZone,
              })}, ${formatDateTimeRange(
                result.startTime,
                endOf(result),
                "time",
                {
                  timeZone: readZone,
                },
              )}`
            : formatDateTime(result.startTime, "dateFull", { timeZone: "UTC" });
          return (
            <VoteCell
              optionId={result.optionId}
              optionLabel={optionLabel}
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
      response,
      savedVotes,
    ],
  );

  const table = useReactTable({
    data: results,
    columns,
    getRowId: (result) => result.optionId,
    getCoreRowModel: getCoreRowModel(),
  });

  // The tint follows the vote being composed, not just the saved one, so
  // the row responds as the viewer picks. Same colours as the calendar.
  // The gradient is a background image, so the row's hover colour would
  // show through its transparent end; hover is cleared to keep it clean.
  const { byOption: currentVotes } = useVotesByOption(savedVotes);
  const getRowClassName = (result: VoteResult) => {
    const vote = currentVotes.get(result.optionId);
    if (vote === "yes") {
      return "bg-linear-to-r from-green-50 to-transparent text-green-700 hover:bg-transparent dark:from-green-500/10 dark:text-green-400";
    }
    if (vote === "ifNeedBe") {
      return "bg-linear-to-r from-amber-50 to-transparent text-amber-700 hover:bg-transparent dark:from-amber-500/10 dark:text-amber-400";
    }
    return undefined;
  };

  // DataList groups adjacent rows, and the loader returns options in time
  // order, so each day's slots already sit together.
  const getGroup = isTimeSlot
    ? (result: VoteResult) => {
        const key = getCalendarDate(result.startTime, readZone ?? "UTC");
        return {
          id: key,
          label: (
            <>
              <CalendarDate
                value={calendarDateToUTCMidnight(key)}
                preset="weekday"
                className="font-medium text-foreground"
              />
              <CalendarDate
                value={calendarDateToUTCMidnight(key)}
                preset="dateLong"
                className="text-muted-foreground"
              />
            </>
          ),
        };
      }
    : undefined;

  return (
    // The scroll area. Only the results scroll, and only from lg: below
    // that the page scrolls, so the list grows to its natural height.
    <div className="lg:scrollbar-thin dark:lg:scrollbar-thumb-gray-600 dark:lg:scrollbar-track-gray-800 hover:lg:scrollbar-thumb-gray-400 dark:hover:lg:scrollbar-thumb-gray-500 lg:scrollbar-thumb-gray-300 lg:scrollbar-track-transparent relative flex-1 lg:min-h-0 lg:overflow-y-auto">
      <DataList
        table={table}
        getGroup={getGroup}
        getRowClassName={getRowClassName}
        rowGapClassName="gap-y-1"
        // py-4 to match DataList's own px-4: its default py-2 leaves the
        // last row's vote control close to the panel's edge.
        className="grid-cols-[minmax(0,1fr)_auto] py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
      />
    </div>
  );
}
