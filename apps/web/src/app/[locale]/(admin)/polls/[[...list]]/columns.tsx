import { PollStatus } from "@rallly/database";
import { Icon } from "@rallly/ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import { BarChart2Icon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useTranslation } from "react-i18next";

import { PollStatusBadge } from "@/components/poll-status";
import { Trans } from "@/components/trans";
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
    id: string;
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
        size: 1000,
        cell: ({ row }) => {
          return (
            <div>
              <Link
                href={`/invite/${row.original.id}`}
                className="group absolute inset-0 flex items-center gap-x-2.5"
              />
              <span className="flex items-center gap-x-2.5 truncate whitespace-nowrap text-sm font-medium group-hover:underline">
                <Icon>
                  <BarChart2Icon />
                </Icon>
                {row.original.title}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("user", {
        header: () => (
          <div className="text-center">
            {t("host", { defaultValue: "Host" })}
          </div>
        ),
        size: 75,
        cell: ({ getValue }) => {
          const isYou = getValue()?.id === user.id;
          return (
            <div className="text-center">
              <Tooltip>
                <TooltipTrigger>
                  <UserAvatar size="xs" name={getValue()?.name} />
                </TooltipTrigger>
                <TooltipContent>
                  {isYou ? t("you") : getValue()?.name ?? t("guest")}
                </TooltipContent>
              </Tooltip>
            </div>
          );
        },
      }),
      columnHelper.accessor("createdAt", {
        header: () => <Trans i18nKey="created" defaults="Created" />,
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
                    {adjustTimeZone(
                      row.original.event.start,
                      !row.original.timeZone,
                    ).format("LLLL")}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <PollStatusBadge status={row.original.status} />
              )}
            </div>
          );
        },
      }),

      columnHelper.accessor("participants", {
        header: () => null,
        cell: ({ row }) => {
          if (row.original.userId !== user.id) {
            return null;
          }

          return (
            <Link
              className="text-link text-sm"
              href={`/poll/${row.original.id}`}
            >
              <Trans i18nKey="manage" />
            </Link>
          );
        },
      }),
    ],
    [adjustTimeZone, t, user.id],
  );
};
