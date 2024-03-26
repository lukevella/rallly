import { PollStatus } from "@rallly/database";
import { Flex } from "@rallly/ui/flex";
import { Icon } from "@rallly/ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import { BarChart2Icon, MailIcon } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { PollStatusBadge } from "@/components/poll-status";
import { UserAvatar } from "@/components/user";
import { useDayjs } from "@/utils/dayjs";

export type Response = {
  id: string;
  pollId: string;
  name: string;
  createdAt: Date;
  poll: {
    title: string;
    status: PollStatus;
  };
  user?: {
    name: string;
  } | null;
  event?: {
    start: Date;
  } | null;
};

const columnHelper = createColumnHelper<Response>();

export const useInviteColumns = () => {
  const { dayjs } = useDayjs();
  const { t } = useTranslation("app");
  return [
    columnHelper.accessor("poll.title", {
      header: "Name",
      size: 500,
      cell: ({ renderValue, row }) => (
        <div className="flex items-center gap-x-2.5">
          <Icon>
            <MailIcon />
          </Icon>
          <Link
            href={`/invite/${row.original.pollId}`}
            className="hover:text-primary gap flex items-center whitespace-nowrap text-sm font-medium hover:underline"
          >
            <span className="truncate">{renderValue()}</span>
          </Link>
        </div>
      ),
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
    columnHelper.accessor("user.name", {
      header: "Host",
      cell: ({ renderValue }) => (
        <Flex>
          <UserAvatar size="sm" name={renderValue() ?? t("guest")} />
          <span>{renderValue()}</span>
        </Flex>
      ),
    }),
    columnHelper.display({
      header: t("inviteType", {
        defaultValue: "Type",
      }),
      cell: () => (
        <span className="gap flex items-center">
          <Icon>
            <BarChart2Icon />
          </Icon>
          <span className="text-sm font-medium">Poll</span>
        </span>
      ),
    }),
    columnHelper.accessor("createdAt", {
      header: "Responded",
      size: 240,
      cell: ({ renderValue }) => (
        <span className="text-muted-foreground whitespace-nowrap text-sm">
          {dayjs(renderValue()).format("LLL")}
        </span>
      ),
    }),
  ];
};
