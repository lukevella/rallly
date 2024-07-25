import { PollStatus } from "@rallly/database";
import { cn } from "@rallly/ui";
import { Icon } from "@rallly/ui/icon";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import dayjs from "dayjs";
import { CalendarPlusIcon, MessageCircleIcon, UserIcon } from "lucide-react";
import Link from "next/link";

import { GroupPollIcon } from "@/app/[locale]/(admin)/app-card";
import { CopyLinkButton } from "@/app/[locale]/(admin)/polls/copy-invite-link-button";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/app/components/empty-state";
import { PollStatusBadge } from "@/components/poll-status";
import { Trans } from "@/components/trans";

export function PollsListView({
  data,
}: {
  data: {
    id: string;
    status: PollStatus;
    title: string;
    createdAt: Date;
    userId: string;
    participants: {
      id: string;
      name: string;
    }[];
    _count: {
      participants: number;
      comments: number;
    };
  }[];
}) {
  const table = useReactTable({
    columns: [],
    data,
    getCoreRowModel: getCoreRowModel(),
  });
  if (data?.length === 0) {
    return (
      <EmptyState className="h-96">
        <EmptyStateIcon>
          <CalendarPlusIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>
          <Trans i18nKey="noPolls" />
        </EmptyStateTitle>
        <EmptyStateDescription>
          <Trans i18nKey="noPollsDescription" />
        </EmptyStateDescription>
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-3 sm:gap-4">
      {table.getRowModel().rows.map((row) => (
        <div
          className={cn("overflow-hidden rounded-lg border bg-white p-1")}
          key={row.id}
        >
          <div className="relative space-y-4 p-3 focus-within:bg-gray-100">
            <div className="flex items-start justify-between">
              <GroupPollIcon size="sm" />
              <PollStatusBadge status={row.original.status} />
            </div>
            <div className="space-y-2">
              <h2 className="truncate text-base font-medium">
                <Link
                  href={`/poll/${row.original.id}`}
                  className="absolute inset-0 z-10"
                />
                {row.original.title}
              </h2>
              <div className="flex items-center gap-x-4">
                <div className="inline-flex items-center gap-x-1.5 text-sm font-medium">
                  <Icon>
                    <UserIcon />
                  </Icon>
                  <span>{row.original._count.participants}</span>
                </div>
                <div className="inline-flex items-center gap-x-1.5 text-sm font-medium">
                  <Icon>
                    <MessageCircleIcon />
                  </Icon>
                  <span>{row.original._count.comments}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-end justify-between p-3">
            <CopyLinkButton pollId={row.original.id} />
            <p className="text-muted-foreground whitespace-nowrap text-sm">
              <Trans
                i18nKey="createdTime"
                values={{
                  relativeTime: dayjs(row.original.createdAt).fromNow(),
                }}
              />
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
