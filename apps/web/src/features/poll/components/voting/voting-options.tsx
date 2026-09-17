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
import { usePoll as usePollScores } from "@/features/poll/components/poll-context";
import { ConnectedScoreSummary } from "@/features/poll/components/score-summary";
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
  const { getScore, poll } = usePollScores();
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

function VoteLabel({ type }: { type?: VoteType }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <VoteIcon type={type} />
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
 * TanStack Table owns the grouping; each group renders as its own body with
 * a row group heading so assistive tech announces the day or month once.
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

  return (
    // A flex-1 table would spread spare height across its rows.
    <div className="flex-1">
      <table className="w-full text-sm">
        <caption className="sr-only">
          {t("pollOptions", { defaultValue: "Poll options" })}
        </caption>
        <thead className="sr-only">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} scope="col">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        {/* Top-level rows of the grouped model are the groups; their subRows
          are the options. */}
        {table.getGroupedRowModel().rows.map((groupRow, groupIndex) => {
          const id = `${headingId}-${groupIndex}`;
          const groupCell = groupRow
            .getAllCells()
            .find((cell) => cell.column.id === "group");
          return (
            <tbody key={groupRow.id} aria-labelledby={id}>
              <tr>
                <th
                  id={id}
                  scope="rowgroup"
                  colSpan={visibleColumnCount}
                  className="border-y bg-muted/50 px-4 py-2 text-left font-medium"
                >
                  {groupCell
                    ? flexRender(
                        groupCell.column.columnDef.cell,
                        groupCell.getContext(),
                      )
                    : null}
                </th>
              </tr>
              {groupRow.subRows.map((row) => (
                <tr
                  key={row.id}
                  data-testid="poll-option"
                  className="border-b last:border-b-0"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={
                        cell.column.id === "option"
                          ? "w-full whitespace-nowrap px-4 py-2"
                          : "px-2 py-2 text-right last:pr-4"
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}
