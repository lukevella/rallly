import { ClockIcon } from "@rallly/icons";
import { cn } from "@rallly/ui";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import dayjs from "dayjs";
import React from "react";
import { Trans } from "react-i18next";

import { DateIcon } from "@/components/date-icon";
import { useParticipants } from "@/components/participants-provider";
import { VoteSummaryProgressBar } from "@/components/vote-summary-progress-bar";

type DateOption = {
  id: string;
  start: Date;
  duration: number;
  votes: {
    yes: string[];
    ifNeedBe: string[];
    no: string[];
  };
};
const optionColumnHelper = createColumnHelper<DateOption>();

export const DatesTable = (props: {
  data: DateOption[];
  className?: string;
}) => {
  const { participants } = useParticipants();
  const table = useReactTable<DateOption>({
    data: props.data,
    columns: [
      optionColumnHelper.accessor("start", {
        header: () => <Trans i18nKey="poll.date" defaults="Date" />,
        size: 90,
        cell: (info) =>
          info.row.original.duration ? (
            <div className="flex items-center gap-2 whitespace-nowrap font-semibold tabular-nums">
              <ClockIcon className="h-5" />
              {dayjs(info.getValue()).format("LT")}
            </div>
          ) : (
            <DateIcon date={dayjs(info.getValue())} />
          ),
      }),
      optionColumnHelper.accessor("duration", {
        id: "duration",
        size: 120,
        header: () => <Trans i18nKey="duration" defaults="Duration" />,
        cell: (info) => (
          <div className="flex items-center gap-2 whitespace-nowrap text-gray-500">
            <ClockIcon className="h-5" />
            {info.getValue() ? (
              dayjs.duration(info.getValue(), "minutes").humanize()
            ) : (
              <Trans i18nKey="allDay" defaults="All-day" />
            )}
          </div>
        ),
      }),
      optionColumnHelper.accessor("votes", {
        id: "popularity",
        header: () => <Trans defaults="Popularity" i18nKey="popularity" />,
        size: 300,
        cell: (info) => {
          return (
            <div className="min-w-[100px]">
              <VoteSummaryProgressBar
                {...info.getValue()}
                total={participants.length}
              />
            </div>
          );
        },
      }),

      // optionColumnHelper.display({
      //   id: "participants",
      //   size: 100,
      //   header: () => <Trans defaults="Participants" i18nKey="participants" />,
      //   cell: (info) => {
      //     return (
      //       <ParticipantAvatarBar
      //         participants={responses.filter((response) => {
      //           return scoreByOptionId[info.row.original.id].yes.includes(
      //             response.id,
      //           );
      //         })}
      //         max={5}
      //       />
      //     );
      //   },
      // }),
    ],
    getCoreRowModel: getCoreRowModel(),
    initialState: {
      grouping: ["group"],
      columnVisibility: { group: false },
      expanded: true,
    },
  });

  return (
    <div className={cn("rounded-md border", props.className)}>
      <table className={cn("w-full table-auto border-collapse bg-white")}>
        <tbody>
          {table.getRowModel().rows.map((row, i) => {
            return (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={cn(
                      "overflow-hidden border-gray-100 px-2.5 py-2.5",
                      {
                        "border-b ": table.getRowModel().rows.length !== i + 1,
                      },
                    )}
                    style={{
                      width: cell.column.getSize(),
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
