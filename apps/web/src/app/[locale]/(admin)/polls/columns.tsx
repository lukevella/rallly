import { PollStatus } from "@rallly/database";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import { BarChart2Icon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useTranslation } from "react-i18next";

import { ParticipantAvatarBar } from "@/components/participant-avatar-bar";
import { PollStatusBadge } from "@/components/poll-status";
import { useDayjs } from "@/utils/dayjs";

export type PollData = {
  id: string;
  status: PollStatus;
  title: string;
  createdAt: Date;
  participants: { name: string }[];
  timeZone: string | null;
  userId: string;
  user: {
    name: string;
  } | null;
  event: {
    start: Date;
    duration: number;
  } | null;
};

const columnHelper = createColumnHelper<PollData>();

export const usePollColumns = () => {
  const { t } = useTranslation();
  const { adjustTimeZone } = useDayjs();
  return React.useMemo(
    () => [
      columnHelper.accessor("title", {
        id: "title",
        header: t("title"),
        size: 500,
        cell: ({ row }) => {
          return (
            <Link
              className="group absolute inset-1 flex items-center gap-x-2.5 px-5 hover:bg-gray-200 active:bg-gray-100"
              href={`/poll/${row.original.id}`}
            >
              <BarChart2Icon className="size-4 text-gray-500" />
              <span className="truncate whitespace-nowrap text-sm font-medium">
                {row.original.title}
              </span>
            </Link>
          );
        },
      }),
      columnHelper.accessor("status", {
        header: t("pollStatus", { defaultValue: "Status" }),
        cell: ({ row }) => {
          return (
            <div className="text-muted-foreground text-sm">
              {row.original.event ? (
                <Tooltip>
                  <TooltipTrigger>
                    <PollStatusBadge status={row.original.status} />
                  </TooltipTrigger>
                  <TooltipContent>
                    {adjustTimeZone(row.original.event.start).format("LLLL")}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <PollStatusBadge status={row.original.status} />
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("createdAt", {
        header: t("created", {
          defaultValue: "Created",
        }),
        cell: ({ row }) => {
          const { createdAt } = row.original;
          return (
            <p className="text-muted-foreground whitespace-nowrap text-sm">
              <time dateTime={createdAt.toDateString()}>
                {dayjs(createdAt).fromNow()}
              </time>
            </p>
          );
        },
      }),
      columnHelper.accessor("participants", {
        header: t("participants", { defaultValue: "Participants" }),
        size: 200,
        cell: ({ row }) => {
          return (
            <ParticipantAvatarBar
              participants={row.original.participants}
              max={5}
            />
          );
        },
      }),
    ],
    [adjustTimeZone, t],
  );
};
