import { PollStatus } from "@rallly/database";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import { BarChart2Icon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useTranslation } from "react-i18next";

import { ParticipantAvatarBar } from "@/components/participant-avatar-bar";
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
            <div className="flex items-center gap-x-2.5">
              <BarChart2Icon className="size-4 text-gray-500" />
              <Link
                href={`/poll/${row.original.id}`}
                className="hover:text-primary whitespace-nowrap text-sm font-medium hover:underline"
              >
                {row.original.title}
              </Link>
            </div>
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
      columnHelper.accessor("status", {
        header: t("pollStatus", { defaultValue: "Status" }),
        cell: ({ row }) => {
          return (
            <div className="text-muted-foreground text-sm">
              {row.original.event ? (
                <Tooltip>
                  <TooltipTrigger>{row.original.status}</TooltipTrigger>
                  <TooltipContent>
                    {adjustTimeZone(row.original.event.start).format("LLLL")}
                  </TooltipContent>
                </Tooltip>
              ) : (
                row.original.status
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
    ],
    [adjustTimeZone, t],
  );
};
