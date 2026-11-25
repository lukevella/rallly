"use client";

import { buttonVariants } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { CircleStopIcon, InboxIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { FilterTabs } from "@/components/filter-tabs";
import { Link } from "@/components/link";
import { MemberSelector } from "@/components/member-selector";
import {
  PageActions,
  PageColumn,
  PageContent,
  PageHeader,
  PageShell,
  PageTitle,
  PageToolbar,
} from "@/components/page";
import { SearchInput } from "@/components/search-input";
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
  disabled,
  startTransition,
}: {
  page: number;
  hasNextPage: boolean;
  // While a navigation is pending the URL still holds the previous filters,
  // so a page link built from it would replace the pending change.
  disabled: boolean;
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
      {page > 1 && !disabled ? (
        pageLink(page - 1, previousLabel)
      ) : (
        <Button disabled>{previousLabel}</Button>
      )}
      {hasNextPage && !disabled ? (
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
  // Filter and page changes are server navigations inside a transition, so
  // the current list stays on screen until the new one is rendered.
  const [isNavigating, startNavigation] = React.useTransition();
  const { data: space } = useSpace();
  // Filtering by member is pointless when the space restricts this member
  // to their own polls.
  const showMemberFilter = space.shared;

  const { status } = searchParamsSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );

  return (
    <PageShell>
      <PageHeader>
        <PageColumn>
          <PageTitle>
            <Trans i18nKey="polls" defaults="Polls" />
          </PageTitle>
          <PageToolbar className="pt-6">
            {/* Below sm, search and the CTA share the first row and the
                filters take the full second row whatever the width. */}
            <SearchInput
              className="min-w-40 flex-1 max-sm:order-first sm:min-w-48"
              placeholder={t("searchPollsPlaceholder", {
                defaultValue: "Search polls by title...",
              })}
              startTransition={startNavigation}
            />
            <div className="flex min-w-0 items-center gap-2 max-sm:w-full">
              <FilterTabs
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
                    label: (
                      <Trans i18nKey="pollStatusClosed" defaults="Closed" />
                    ),
                  },
                  {
                    value: "scheduled",
                    label: (
                      <Trans
                        i18nKey="pollStatusScheduled"
                        defaults="Scheduled"
                      />
                    ),
                  },
                ]}
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
            <PageActions className="max-sm:order-first">
              {usageMeter}
              <Link
                href="/new"
                className={buttonVariants({ variant: "primary" })}
              >
                <Trans i18nKey="create" defaults="Create" />
              </Link>
            </PageActions>
          </PageToolbar>
        </PageColumn>
      </PageHeader>
      <PageContent>
        <PageColumn className="pb-8">
          {/* Dims only once loading outlasts the delay, so a fast change
              never flickers; restores at once when the new list lands */}
          <div
            aria-busy={isNavigating}
            className="transition-opacity duration-200 aria-busy:opacity-50 aria-busy:delay-150"
          >
            {list}
            <PollsPagination
              page={page}
              hasNextPage={hasNextPage}
              disabled={isNavigating}
              startTransition={startNavigation}
            />
          </div>
        </PageColumn>
      </PageContent>
    </PageShell>
  );
}
