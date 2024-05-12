"use client";
import { Button } from "@rallly/ui/button";
import { Card } from "@rallly/ui/card";
import { Flex } from "@rallly/ui/flex";
import { Icon } from "@rallly/ui/icon";
import { PaginationState } from "@tanstack/react-table";
import { BarChart2Icon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";

import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/app/components/empty-state";
import { Spinner } from "@/components/spinner";
import { Table } from "@/components/table";
import { Trans } from "@/components/trans";
import { trpc } from "@/utils/trpc/client";

import { PollData, usePollColumns } from "./columns";

function PollsEmptyState() {
  const { t } = useTranslation();
  return (
    <EmptyState className="h-96 rounded-lg border-2 border-dashed">
      <EmptyStateIcon>
        <BarChart2Icon />
      </EmptyStateIcon>
      <EmptyStateTitle>
        {t("noPolls", { defaultValue: "No Polls" })}
      </EmptyStateTitle>
      <EmptyStateDescription>{t("noPollsDescription")}</EmptyStateDescription>
      <EmptyStateFooter>
        <Button variant="primary" asChild>
          <Link href="/new">
            <Icon>
              <PlusIcon />
            </Icon>
            <Trans i18nKey="newPoll" />
          </Link>
        </Button>
      </EmptyStateFooter>
    </EmptyState>
  );
}

export function PollsList({ list }: { list?: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const router = useRouter();
  const pagination = React.useMemo<PaginationState>(
    () => ({
      pageIndex: (Number(searchParams?.get("page")) || 1) - 1,
      pageSize: Number(searchParams?.get("pageSize")) || 10,
    }),
    [searchParams],
  );

  // const sorting = React.useMemo<SortingState>(() => {
  //   const id = searchParams?.get("sort");
  //   const desc = searchParams?.get("desc");
  //   if (!id) {
  //     return [{ id: "createdAt", desc: true }];
  //   }
  //   return [{ id, desc: desc === "desc" }];
  // }, [searchParams]);

  const { data, isFetching } = trpc.polls.paginatedList.useQuery(
    { list, pagination },
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

  return (
    <div className="space-y-4">
      {data.total ? (
        <Card>
          <Table
            className={isFetching ? "opacity-50" : undefined}
            layout="auto"
            paginationState={pagination}
            enableTableHeader={true}
            data={data.rows as PollData[]}
            pageCount={Math.ceil(data.total / pagination.pageSize)}
            // sortingState={sorting}
            // onSortingChange={(updater) => {
            //   const newSorting =
            //     typeof updater === "function" ? updater(sorting) : updater;

            //   const current = new URLSearchParams(searchParams ?? undefined);
            //   const sortColumn = newSorting[0];
            //   if (sortColumn === undefined) {
            //     current.delete("sort");
            //     current.delete("desc");
            //   } else {
            //     current.set("sort", sortColumn.id);
            //     current.set("desc", sortColumn.desc ? "desc" : "asc");
            //   }
            //   // current.set("pageSize", String(newPagination.pageSize));
            //   router.replace(`${pathname}?${current.toString()}`);
            // }}
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
        </Card>
      ) : (
        <PollsEmptyState />
      )}
    </div>
  );
}
