"use client";
import { PollStatus } from "@rallly/database";
import { Button } from "@rallly/ui/button";
import { Card } from "@rallly/ui/card";
import { Flex } from "@rallly/ui/flex";
import { Icon } from "@rallly/ui/icon";
import { PaginationState } from "@tanstack/react-table";
import { BarChart2Icon, ChevronsUpDownIcon, SquarePenIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/app/components/empty-state";
import { Spinner } from "@/components/spinner";
import { Table } from "@/components/table";
import { Trans } from "@/components/trans";
import { trpc } from "@/utils/trpc/client";

import { PollData, usePollColumns } from "./columns";

export function PollsList() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const status = (searchParams?.get("status") ?? "all") as PollStatus | "all";
  const pagination = React.useMemo<PaginationState>(
    () => ({
      pageIndex: (Number(searchParams?.get("page")) || 1) - 1,
      pageSize: Number(searchParams?.get("pageSize")) || 15,
    }),
    [searchParams],
  );

  const { data, isFetching } = trpc.polls.paginatedList.useQuery(
    { pagination, status: status },
    {
      staleTime: Infinity,
      cacheTime: Infinity,
      keepPreviousData: true,
    },
  );

  const columns = usePollColumns();

  if (!data) {
    // return a table using <Skeleton /> components
    return (
      <Flex className="h-screen" align="center" justify="center">
        <Spinner className="text-muted-foreground" />
      </Flex>
    );
  }

  if (data.total === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={<BarChart2Icon />}
          title={t("noPollsFound", {
            defaultValue: "No Polls Found",
          })}
          description={t("noPollsDescription")}
        >
          <Button variant="primary" asChild>
            <Link href="/new">
              <Icon>
                <SquarePenIcon />
              </Icon>
              <Trans i18nKey="createPollAction" defaults="Create Poll" />
            </Link>
          </Button>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-x-4">
        <div className="flex items-center gap-x-4">
          <Button>
            <span className="text-gray-500">Status:</span> All
            <Icon>
              <ChevronsUpDownIcon />
            </Icon>
          </Button>
          <div className="text-sm font-medium">
            <Trans
              i18nKey="pollsCount"
              defaults="{count, plural, =0 {No Polls} one {# Poll} other {# Polls}}"
              values={{ count: data.total }}
            />
          </div>
        </div>
      </div>

      <Card>
        {data.total ? (
          <Table
            className={isFetching ? "opacity-50" : undefined}
            layout="auto"
            paginationState={pagination}
            enableTableHeader={true}
            data={data.rows as PollData[]}
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
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={<BarChart2Icon />}
              title={t("noPolls", { defaultValue: "No Polls" })}
              description={t("noPollsDescription")}
            >
              <Button variant="primary" asChild>
                <Link href="/new">
                  <Icon>
                    <SquarePenIcon />
                  </Icon>
                  <Trans i18nKey="createPoll" defaults="Create poll" />
                </Link>
              </Button>
            </EmptyState>
          </div>
        )}
      </Card>
    </div>
  );
}
