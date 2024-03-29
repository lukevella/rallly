"use client";
import { Button } from "@rallly/ui/button";
import { Card } from "@rallly/ui/card";
import { Flex } from "@rallly/ui/flex";
import { Icon } from "@rallly/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import { PaginationState } from "@tanstack/react-table";
import {
  BarChart2Icon,
  ChevronsUpDownIcon,
  ListIcon,
  SquarePenIcon,
  VoteIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { list } from "postcss";
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
    <EmptyState>
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
              <SquarePenIcon />
            </Icon>
            <Trans i18nKey="createPoll" defaults="Create poll" />
          </Link>
        </Button>
      </EmptyStateFooter>
    </EmptyState>
  );
}

function useListFilter() {
  const searchParams = useSearchParams();
  return searchParams?.get("list") ?? "all";
}

function PollOwnerSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="">
            <Flex align="center">
              <Icon>
                <ListIcon />
              </Icon>
              <Trans i18nKey="listFilterShowAll" defaults="Show All" />
            </Flex>
          </SelectItem>
          <SelectItem value="mine">
            <Flex align="center">
              <Icon>
                <BarChart2Icon />
              </Icon>
              <Trans
                i18nKey="listFilterPollsICreated"
                defaults="Polls I Created"
              />
            </Flex>
          </SelectItem>
          <SelectItem value="participated">
            <Flex align="center">
              <Icon>
                <VoteIcon />
              </Icon>
              <Trans
                i18nKey="listFilterPollsIParticipated"
                defaults="Polls I Participated In"
              />
            </Flex>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function PollsList() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const { t } = useTranslation();
  const router = useRouter();
  const list = useListFilter();
  const pagination = React.useMemo<PaginationState>(
    () => ({
      pageIndex: (Number(searchParams?.get("page")) || 1) - 1,
      pageSize: Number(searchParams?.get("pageSize")) || 10,
    }),
    [searchParams],
  );

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

  if (data.total === 0) {
    return (
      <div className="flex items-center justify-center">
        <PollsEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PollOwnerSelect
        value={list}
        onChange={(newList) => {
          const current = new URLSearchParams(
            Array.from(searchParams?.entries() ?? []),
          );
          if (newList === "all") {
            current.delete("list");
          } else {
            current.set("list", newList);
          }
          current.delete("page");
          const search = current.toString();
          const query = search ? `?${search}` : "";

          router.replace(pathname + query);
        }}
      />
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
        ) : null}
      </Card>
    </div>
  );
}
