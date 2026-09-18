/** biome-ignore-all lint/a11y/useSemanticElements: ARIA table on divs so rows can be CSS grids; table elements lose their semantics under display: grid in Chrome and Safari */
/** biome-ignore-all lint/a11y/useFocusableInteractive: row and header roles are only interactive inside role="grid", not role="table" */
"use client";
import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getGroupedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";
import { usePoll as usePollDetails } from "@/features/poll/client";
import { ConnectedScoreSummary } from "@/features/poll/components/score-summary";
import { usePollScores } from "@/features/poll/components/use-poll-scores";
import { IfScoresVisible } from "@/features/poll/components/visibility";
import { VoteBreakdownDialog } from "@/features/poll/components/vote-breakdown-dialog";
import VoteIcon from "@/features/poll/components/vote-icon";
import { VoteSegmentedControl } from "@/features/poll/components/vote-segmented-control";
import { useVotingForm } from "@/features/poll/components/voting-form";
import type { VoteType } from "@/features/poll/constants";
import {
  EventDate,
  EventTimeRange,
} from "@/features/scheduled-event/components/event-date-time";
import { Trans, useTranslation } from "@/i18n/client";
import { CalendarDate } from "@/lib/datetime/calendar-date";
import { useDateTime } from "@/lib/datetime/client";

function VoteBreakdownButton({
  optionId,
  optionLabel,
}: {
  optionId: string;
  optionLabel: string;
}) {
  const { t } = useTranslation();
  const { getScore } = usePollScores();
  const poll = usePollDetails();
  const { yes, ifNeedBe } = getScore(optionId);
  const dialog = useDialog();
  const breakdown = poll.allowTentativeVotes
    ? t("optionVoteBreakdown", {
        defaultValue: "{yesScore} yes, {ifNeedBeScore} if need be",
        yesScore: yes,
        ifNeedBeScore: ifNeedBe,
      })
    : t("optionVoteBreakdownYesOnly", {
        defaultValue: "{yesScore} yes",
        yesScore: yes,
      });

  return (
    <IfScoresVisible>
      <Button
        {...dialog.triggerProps}
        variant="ghost"
        size="sm"
        aria-label={`${breakdown}. ${t("showParticipantVotes", {
          defaultValue: "Show participant votes",
        })}`}
      >
        <ConnectedScoreSummary optionId={optionId} />
      </Button>
      <VoteBreakdownDialog
        {...dialog.dialogProps}
        optionId={optionId}
        optionLabel={optionLabel}
      />
    </IfScoresVisible>
  );
}

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

type PollOption = { id: string; startTime: Date; duration: number };

const endOf = (option: PollOption) =>
  new Date(option.startTime.getTime() + option.duration * 60_000);

/**
 * The vote control while a response is being composed, or the recorded
 * vote once saved. Reads the form itself so the column definitions stay
 * stable across renders (TanStack rebuilds the table when they change).
 */
function VoteCell({
  option,
  optionLabel,
}: {
  option: PollOption;
  optionLabel: string;
}) {
  const poll = usePollDetails();
  const { getVote, optionIds } = usePollScores();
  const votingForm = useVotingForm();
  const mode = votingForm.watch("mode");
  const votes = votingForm.watch("votes");
  const participantId = votingForm.watch("participantId");
  const editable = mode !== "view";
  const index = optionIds.indexOf(option.id);
  const vote = editable
    ? votes[index]?.type
    : participantId
      ? getVote(participantId, option.id)
      : undefined;

  if (editable) {
    return (
      <VoteSegmentedControl
        value={vote}
        onChange={(newVote) => {
          const next = [...votes];
          next[index] = { optionId: option.id, type: newVote };
          votingForm.setValue("votes", next, { shouldDirty: true });
        }}
        optionLabel={optionLabel}
        allowTentativeVotes={poll.allowTentativeVotes}
      />
    );
  }
  return vote !== undefined ? <VoteLabel type={vote} /> : null;
}

const columnHelper = createColumnHelper<PollOption>();

// Stable references: TanStack recomputes the grouped model whenever these
// change identity.
const tableState = {
  grouping: ["group"],
  columnVisibility: { group: false },
};

/**
 * The options as a table grouped by day (time polls) or month (date polls).
 * TanStack Table owns the grouping; each group renders as its own row group
 * with a heading so assistive tech announces the day or month once.
 */
export function VotingOptions() {
  const poll = usePollDetails();
  const { formatDateTime, formatDateTimeRange } = useDateTime();
  const { t } = useTranslation();
  const headingId = React.useId();

  const isTimeSlot = (poll.options[0]?.duration ?? 0) > 0;
  // All-day dates and floating times are stored as UTC wall time and read
  // back in UTC; a zoned time poll is read in the viewer's zone.
  const readZone = isTimeSlot && poll.timeZone ? undefined : "UTC";

  const columns = React.useMemo(
    () => [
      // Grouping key: the formatted day or month in the viewer's zone. The
      // column is hidden; its cell renders the group heading.
      columnHelper.accessor(
        (option) =>
          formatDateTime(
            option.startTime,
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
          <VoteBreakdownButton
            optionId={row.original.id}
            optionLabel={row.getValue<string>("group")}
          />
        ),
      }),
      columnHelper.display({
        id: "vote",
        header: () => <Trans i18nKey="yourVote" defaults="Your vote" />,
        cell: ({ row }) => {
          const option = row.original;
          // Full date and time as text, for the vote control's name.
          const optionLabel = isTimeSlot
            ? `${row.getValue<string>("group")}, ${formatDateTimeRange(
                option.startTime,
                endOf(option),
                "time",
                { timeZone: readZone },
              )}`
            : formatDateTime(option.startTime, "dateFull", {
                timeZone: "UTC",
              });
          return <VoteCell option={option} optionLabel={optionLabel} />;
        },
      }),
    ],
    [formatDateTime, formatDateTimeRange, isTimeSlot, poll.timeZone, readZone],
  );

  const table = useReactTable({
    data: poll.options,
    columns,
    getRowId: (option) => option.id,
    state: tableState,
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
  });

  const visibleColumnCount = table.getVisibleLeafColumns().length;

  // ARIA table roles on divs: rows are CSS grids, which table elements
  // cannot be without losing their semantics in Chrome and Safari.
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
        {/* Top-level rows of the grouped model are the groups; their subRows
            are the options. */}
        {table.getGroupedRowModel().rows.map((groupRow, groupIndex) => {
          const id = `${headingId}-${groupIndex}`;
          const groupCell = groupRow
            .getAllCells()
            .find((cell) => cell.column.id === "group");
          return (
            <div key={groupRow.id} role="rowgroup" aria-labelledby={id}>
              <div role="row">
                <div
                  id={id}
                  role="rowheader"
                  aria-colspan={visibleColumnCount}
                  // Pinned at the top of the scroll area while its rows
                  // scroll; solid background so rows do not show through.
                  className="sticky top-0 z-[5] border-b bg-muted px-4 py-2 font-medium"
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
