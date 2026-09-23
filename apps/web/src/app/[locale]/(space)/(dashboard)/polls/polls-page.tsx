"use client";

import { buttonVariants } from "@rallly/ui";
import { CircleStopIcon, InboxIcon, PlusIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { FilterPills } from "@/components/filter-pills";
import { Link } from "@/components/link";
import {
  ListView,
  ListViewActions,
  ListViewHeader,
  ListViewTitle,
  ListViewTitleBar,
  ListViewToolbar,
} from "@/components/list-view";
import { MemberSelector } from "@/components/member-selector";
import { SearchInput } from "@/components/search-input";
import { PollsInfiniteList } from "@/features/poll/components/polls-infinite-list";
import type { PollStatus } from "@/features/poll/schema";
import { useSpace } from "@/features/space/client";
import { Trans, useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";
import { searchParamsSchema } from "./schema";

function NoOpenPollsEmptyState({ closedCount }: { closedCount: number }) {
  return (
    <EmptyState className="h-96">
      <EmptyStateIcon>
        <CircleStopIcon />
      </EmptyStateIcon>
      <EmptyStateTitle>
        <Trans i18nKey="noOpenPolls" defaults="No open polls" />
      </EmptyStateTitle>
      <EmptyStateDescription>
        <Trans
          i18nKey="noOpenPollsDescription"
          defaults="Polls close automatically once all of their dates have passed. You have {count, plural, one {1 closed poll} other {# closed polls}}."
          values={{ count: closedCount }}
        />
      </EmptyStateDescription>
      <EmptyStateFooter className="flex flex-wrap justify-center gap-2">
        <Link
          href="?status=closed"
          className={buttonVariants({ variant: "primary" })}
        >
          <Trans i18nKey="viewClosedPolls" defaults="View closed polls" />
        </Link>
        <Link href="/new" className={buttonVariants()}>
          <Trans i18nKey="createPoll" defaults="Create poll" />
        </Link>
      </EmptyStateFooter>
    </EmptyState>
  );
}

function PollsEmptyState() {
  return (
    <EmptyState className="h-96">
      <EmptyStateIcon>
        <InboxIcon />
      </EmptyStateIcon>
      <EmptyStateTitle>
        <Trans i18nKey="noPolls" defaults="No polls" />
      </EmptyStateTitle>
      <EmptyStateDescription>
        <Trans
          i18nKey="noPollsDescription"
          defaults="Get started by creating a new poll."
        />
      </EmptyStateDescription>
      <EmptyStateFooter>
        <Link href="/new" className={buttonVariants()}>
          <Trans i18nKey="createPoll" defaults="Create poll" />
        </Link>
      </EmptyStateFooter>
    </EmptyState>
  );
}

export function PollsPage({ counts }: { counts: Record<PollStatus, number> }) {
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { data: space } = useSpace();
  const [{ data: members }] = trpc.spaces.listMembers.useSuspenseQuery();
  // Filtering by member is pointless when the space restricts this member
  // to their own polls.
  const showMemberFilter = space.shared;

  const { status, q, member } = searchParamsSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );
  // Ignore a member URL param when the filter is hidden — a bookmarked
  // ?member= URL would otherwise show an empty list with no visible
  // control to clear it.
  const visibleMember = showMemberFilter ? member : undefined;

  const hasFilters = Boolean(q || visibleMember);
  const showClosedPollsPointer =
    status === "open" && !hasFilters && counts.closed > 0;

  return (
    <ListView>
      <ListViewHeader>
        <ListViewTitleBar>
          <ListViewTitle>
            <Trans i18nKey="polls" defaults="Polls" />
          </ListViewTitle>
          <ListViewActions>
            <Link
              href="/new"
              className={buttonVariants({ variant: "primary" })}
            >
              <PlusIcon data-icon="inline-start" />
              <Trans i18nKey="createPoll" defaults="Create poll" />
            </Link>
          </ListViewActions>
        </ListViewTitleBar>
        <ListViewToolbar>
          <FilterPills
            param="status"
            value={status}
            label={t("pollsListStatusFilter", {
              defaultValue: "Filter by status",
            })}
            options={[
              {
                value: "open",
                label: <Trans i18nKey="pollStatusOpen" defaults="Open" />,
                count: counts.open,
              },
              {
                value: "closed",
                label: <Trans i18nKey="pollStatusClosed" defaults="Closed" />,
                count: counts.closed,
              },
              {
                value: "scheduled",
                label: (
                  <Trans i18nKey="pollStatusScheduled" defaults="Scheduled" />
                ),
                count: counts.scheduled,
              },
            ]}
          />
          <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
            <SearchInput
              className="w-auto min-w-0 flex-1 sm:w-56 sm:flex-none"
              placeholder={t("searchPollsPlaceholder", {
                defaultValue: "Search polls by title...",
              })}
            />
            {showMemberFilter ? (
              <MemberSelector
                members={members}
                className="min-w-0 sm:min-w-40"
              />
            ) : null}
          </div>
        </ListViewToolbar>
      </ListViewHeader>
      <PollsInfiniteList
        status={status}
        search={q}
        member={visibleMember}
        emptyState={
          showClosedPollsPointer ? (
            <NoOpenPollsEmptyState closedCount={counts.closed} />
          ) : (
            <PollsEmptyState />
          )
        }
      />
    </ListView>
  );
}
