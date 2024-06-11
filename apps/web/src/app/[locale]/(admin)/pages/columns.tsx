import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import { CopyIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useTranslation } from "react-i18next";
import { useCopyToClipboard } from "react-use";

import { GroupPollIcon } from "@/app/[locale]/(admin)/app-card";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";

export type PendingEvent = {
  id: string;
  paused: boolean;
  title: string;
  createdAt: Date;
  participants: { name: string }[];
  userId: string;
  user: {
    name: string;
    id: string;
  } | null;
};

const columnHelper = createColumnHelper<PendingEvent>();

function CopyLinkButton({ pollId }: { pollId: string }) {
  const [, copy] = useCopyToClipboard();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className="relative z-20"
          onClick={(e) => {
            e.stopPropagation();
            copy(`${window.location.origin}/invite/${pollId}`);
          }}
          variant="ghost"
        >
          <Icon>
            <CopyIcon />
          </Icon>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <Trans i18nKey="copyLink" defaults="Copy Link" />
      </TooltipContent>
    </Tooltip>
  );
}

export const usePendingEventColumns = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  return React.useMemo(
    () => [
      columnHelper.accessor("title", {
        id: "title",
        header: t("title"),
        size: 1000,
        cell: ({ row }) => {
          return (
            <div className="relative flex h-32 justify-between">
              <Link
                className="absolute inset-0 flex min-w-0 items-center gap-4 hover:underline"
                href={`/poll/${row.original.id}`}
              />
              <div className="flex min-w-0 flex-col justify-between gap-4">
                <GroupPollIcon size="sm" />
                <div>
                  <div className="text-base font-medium">
                    {row.original.title}
                  </div>
                  <p className="text-muted-foreground whitespace-nowrap text-sm">
                    <time dateTime={row.original.createdAt.toDateString()}>
                      {dayjs(row.original.createdAt).fromNow()}
                    </time>
                  </p>
                </div>
              </div>
              <div>
                <Badge>Private</Badge>
              </div>
            </div>
          );
        },
      }),
    ],
    [t, user.id],
  );
};
