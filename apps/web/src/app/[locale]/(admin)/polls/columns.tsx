import { PollStatus } from "@rallly/database";
import { Button } from "@rallly/ui/button";
import { Flex } from "@rallly/ui/flex";
import { Icon } from "@rallly/ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import {
  ArrowUpRight,
  ArrowUpRightIcon,
  BarChart2Icon,
  EyeIcon,
  PencilIcon,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { useTranslation } from "react-i18next";

import { ParticipantAvatarBar } from "@/components/participant-avatar-bar";
import { PollStatusBadge } from "@/components/poll-status";
import { UserAvatar } from "@/components/user";
import { useUser } from "@/components/user-provider";
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
  const { user } = useUser();
  return React.useMemo(
    () => [
      columnHelper.accessor("title", {
        id: "title",
        header: t("title"),
        size: 500,
        cell: ({ row }) => {
          return (
            <Link
              href={
                user.id === row.original.userId
                  ? `/poll/${row.original.id}`
                  : `/invite/${row.original.id}`
              }
              className="group absolute inset-0 flex items-center gap-x-2.5 px-4"
            >
              <Icon>
                <BarChart2Icon />
              </Icon>
              <span className="min-w-0 truncate whitespace-nowrap text-sm font-medium group-hover:underline">
                {row.original.title}
              </span>
            </Link>
          );
        },
      }),
      columnHelper.accessor("user", {
        header: () => (
          <div className="w-full text-center">
            {t("host", { defaultValue: "Host" })}
          </div>
        ),
        size: 75,
        cell: ({ getValue }) => {
          return (
            <div className="text-center">
              <UserAvatar size="sm" name={getValue()?.name} />
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
      columnHelper.accessor("status", {
        header: t("pollStatus", { defaultValue: "Status" }),
        cell: ({ row }) => {
          return (
            <div className="text-muted-foreground flex text-sm">
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

      // columnHelper.accessor("participants", {
      //   header: t("participants", { defaultValue: "Participants" }),
      //   size: 200,
      //   cell: ({ row }) => {
      //     return (
      //       <ParticipantAvatarBar
      //         participants={row.original.participants}
      //         max={5}
      //       />
      //     );
      //   },
      // }),
    ],
    [adjustTimeZone, t],
  );
};
