"use client";
import { PollStatus } from "@rallly/database";
import { Button } from "@rallly/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@rallly/ui/card";
import { Flex } from "@rallly/ui/flex";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { createColumnHelper, PaginationState } from "@tanstack/react-table";
import dayjs from "dayjs";
import { BarChart2Icon, VoteIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/app/components/empty-state";
import Badge from "@/components/badge";
import { ParticipantAvatarBar } from "@/components/participant-avatar-bar";
import { Spinner } from "@/components/spinner";
import { Table } from "@/components/table";
import { Trans } from "@/components/trans";
import { UserAvatar } from "@/components/user";
import { useUser } from "@/components/user-provider";
import { useDayjs } from "@/utils/dayjs";
import { trpc } from "@/utils/trpc/client";

type Column = {
  id: string;
  status: PollStatus;
  title: string;
  createdAt: Date;
  participants: { name: string }[];
  timeZone: string | null;
  userId: string;
  user?: {
    name: string;
  };
  event: {
    start: Date;
    duration: number;
  } | null;
};

const columnHelper = createColumnHelper<Column>();

export function PollsList() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const pathname = usePathname();

  const pagination = React.useMemo<PaginationState>(
    () => ({
      pageIndex: (Number(searchParams?.get("page")) || 1) - 1,
      pageSize: Number(searchParams?.get("pageSize")) || 20,
    }),
    [searchParams],
  );

  const { adjustTimeZone } = useDayjs();

  const { data, isFetching } = trpc.polls.paginatedList.useQuery(
    { pagination },
    {
      staleTime: Infinity,
      cacheTime: Infinity,
      keepPreviousData: true,
    },
  );

  const columns = React.useMemo(
    () => [
      columnHelper.display({
        id: "title",
        header: t("title"),
        size: 500,
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-x-2.5">
              {row.original.userId === user.id ? (
                <BarChart2Icon className="size-4 text-gray-500" />
              ) : (
                <VoteIcon className="size-4 text-gray-500" />
              )}
              <Link
                href={
                  row.original.userId === user.id
                    ? `/poll/${row.original.id}`
                    : `/invite/${row.original.id}`
                }
                className="hover:text-primary whitespace-nowrap text-sm font-medium hover:underline"
              >
                {row.original.title}
              </Link>
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
            <div>
              {row.original.event ? (
                <Tooltip>
                  <TooltipTrigger>
                    <Badge color="green">Finalized</Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {adjustTimeZone(row.original.event.start).format("LLLL")}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Badge>Pending</Badge>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("user.name", {
        id: "host",
        maxSize: 75,
        header: t("host", { defaultValue: "Host" }),
        cell: ({ row }) => {
          return <UserAvatar size="sm" name={row.original.user?.name} />;
        },
      }),
      columnHelper.accessor("participants", {
        header: t("participants", { defaultValue: "Participants" }),
        size: 200,
        cell: ({ row }) => {
          return (
            <Tooltip delayDuration={100}>
              <TooltipTrigger className="text-muted-foreground flex items-center gap-x-2">
                <ParticipantAvatarBar
                  participants={row.original.participants}
                  max={5}
                />
              </TooltipTrigger>
              <TooltipContent>
                {row.original.participants.length > 0 ? (
                  <>
                    {row.original.participants
                      .slice(0, 10)
                      .map((participant, i) => (
                        <p key={i}>{participant.name}</p>
                      ))}
                    {row.original.participants.length > 10 ? (
                      <p>
                        <Trans
                          i18nKey="xMore"
                          defaults="{count} more"
                          values={{
                            count: row.original.participants.length - 5,
                          }}
                        />
                      </p>
                    ) : null}
                  </>
                ) : (
                  <Trans i18nKey="noParticipants" defaults="No participants" />
                )}
              </TooltipContent>
            </Tooltip>
          );
        },
      }),
    ],
    [adjustTimeZone, t, user.id],
  );

  if (!data) {
    // return a table using <Skeleton /> components
    return (
      <Flex className="h-screen" align="center" justify="center">
        <Spinner className="text-muted-foreground" />
      </Flex>
    );
  }

  return (
    <Card>
      <CardHeader>
        <Flex gap="sm">
          <CardTitle>Created</CardTitle>
          <Badge>{data.total}</Badge>
        </Flex>
        <CardDescription>Manage the polls you have created</CardDescription>
      </CardHeader>
      {data.total ? (
        <Table
          className={isFetching ? "opacity-50" : undefined}
          layout="auto"
          paginationState={pagination}
          enableTableHeader={true}
          data={data.rows as Column[]}
          pageCount={Math.ceil(data.total / pagination.pageSize)}
          onPaginationChange={(updater) => {
            const newPagination =
              typeof updater === "function" ? updater(pagination) : updater;

            const current = new URLSearchParams(searchParams ?? undefined);
            current.set("page", String(newPagination.pageIndex + 1));
            // current.set("pageSize", String(newPagination.pageSize));
            router.replace(`${pathname}?${current.toString()}`);
          }}
          columns={columns}
        />
      ) : (
        <EmptyState
          icon={BarChart2Icon}
          title={t("noPolls")}
          description={t("noPollsDescription")}
        >
          <Button size="sm" variant="primary" asChild>
            <Link href="/new">
              <Trans i18nKey="createPoll" defaults="Create poll" />
            </Link>
          </Button>
        </EmptyState>
      )}
    </Card>
  );
}
