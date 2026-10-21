"use client";

import { buttonVariants } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { CircleStopIcon, InboxIcon, PlusIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
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
  ListViewContent,
  ListViewHeader,
  ListViewTitle,
  ListViewTitleBar,
  ListViewToolbar,
} from "@/components/list-view";
import { MemberSelector } from "@/components/member-selector";
import { SearchInput } from "@/components/search-input";
import { PollsListSkeleton } from "@/features/poll/components/polls-list";
import { useSpace } from "@/features/space/client";
import { Trans, useTranslation } from "@/i18n/client";
import { searchParamsSchema } from "./schema";

export function NoOpenPollsEmptyState({
  closedCount,
}: {
  closedCount: number;
}) {
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

export function PollsEmptyState() {
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

function PollsPagination({
  page,
  hasNextPage,
  startTransition,
}: {
  page: number;
  hasNextPage: boolean;
  startTransition: React.TransitionStartFunction;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  if (page === 1 && !hasNextPage) {
    return null;
  }

  const hrefFor = (target: number) => {
    const params = new URLSearchParams(searchParams);
    if (target === 1) {
      params.delete("page");
    } else {
      params.set("page", String(target));
    }
    return `?${params.toString()}`;
  };

  const pageLink = (target: number, label: React.ReactNode) => {
    const href = hrefFor(target);
    return (
      <Link
        href={href}
        scroll={false}
        onNavigate={(e) => {
          e.preventDefault();
          startTransition(() => {
            router.push(href, { scroll: false });
          });
        }}
        className={buttonVariants()}
      >
        {label}
      </Link>
    );
  };

  const previousLabel = <Trans i18nKey="previous" defaults="Previous" />;
  const nextLabel = <Trans i18nKey="next" defaults="Next" />;

  return (
    <nav className="flex items-center justify-end gap-2 px-4 py-4">
      {page > 1 ? (
        pageLink(page - 1, previousLabel)
      ) : (
        <Button disabled>{previousLabel}</Button>
      )}
      {hasNextPage ? (
        pageLink(page + 1, nextLabel)
      ) : (
        <Button disabled>{nextLabel}</Button>
      )}
    </nav>
  );
}

export function PollsPage({
  members,
  usageMeter,
  list,
  page,
  hasNextPage,
}: {
  members: { userId: string; name: string; image?: string }[];
  usageMeter: React.ReactNode;
  list: React.ReactNode;
  page: number;
  hasNextPage: boolean;
}) {
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  // Filter and page changes are server navigations that hold the current
  // list until the new one is rendered, so show a skeleton while pending.
  const [isNavigating, startNavigation] = React.useTransition();
  const { data: space } = useSpace();
  // Filtering by member is pointless when the space restricts this member
  // to their own polls.
  const showMemberFilter = space.shared;

  const { status } = searchParamsSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );

  return (
    <ListView>
      <ListViewHeader>
        <ListViewTitleBar>
          <ListViewTitle>
            <Trans i18nKey="polls" defaults="Polls" />
          </ListViewTitle>
          <ListViewActions>
            {usageMeter}
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
              },
              {
                value: "closed",
                label: <Trans i18nKey="pollStatusClosed" defaults="Closed" />,
              },
              {
                value: "scheduled",
                label: (
                  <Trans i18nKey="pollStatusScheduled" defaults="Scheduled" />
                ),
              },
            ]}
            startTransition={startNavigation}
          />
          <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
            <SearchInput
              className="w-auto min-w-0 flex-1 sm:w-56 sm:flex-none"
              placeholder={t("searchPollsPlaceholder", {
                defaultValue: "Search polls by title...",
              })}
              startTransition={startNavigation}
            />
            {showMemberFilter ? (
              <MemberSelector
                members={members}
                className="min-w-0 sm:min-w-40"
                startTransition={startNavigation}
              />
            ) : null}
          </div>
        </ListViewToolbar>
      </ListViewHeader>
      <ListViewContent>
        {isNavigating ? <PollsListSkeleton /> : list}
        {isNavigating ? null : (
          <PollsPagination
            page={page}
            hasNextPage={hasNextPage}
            startTransition={startNavigation}
          />
        )}
      </ListViewContent>
    </ListView>
  );
}
