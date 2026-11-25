"use client";

import { buttonVariants, cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { CalendarIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { FilterTabs } from "@/components/filter-tabs";
import { Link } from "@/components/link";
import { MemberSelector } from "@/components/member-selector";
import {
  PageColumn,
  PageContent,
  PageHeader,
  PageShell,
  PageTitle,
  PageToolbar,
} from "@/components/page";
import { RefreshOnFocus } from "@/components/refresh-on-focus";
import { SearchInput } from "@/components/search-input";
import { CreateButton } from "@/features/navigation/components/create-button";
import type { Status } from "@/features/scheduled-event/schema";
import { useSpace } from "@/features/space/client";
import { Trans, useTranslation } from "@/i18n/client";
import { eventsSearchParamsSchema } from "./schema";

export function EventsEmptyState({ status }: { status: Status }) {
  const contentByStatus: Record<
    Status,
    { title: React.ReactNode; description: React.ReactNode }
  > = {
    upcoming: {
      title: (
        <Trans
          i18nKey="upcomingEventsEmptyStateTitle"
          defaults="No upcoming events"
        />
      ),
      description: (
        <Trans
          i18nKey="upcomingEventsEmptyStateDescription"
          defaults="When you schedule events, they will appear here."
        />
      ),
    },
    past: {
      title: (
        <Trans i18nKey="pastEventsEmptyStateTitle" defaults="No past events" />
      ),
      description: (
        <Trans
          i18nKey="pastEventsEmptyStateDescription"
          defaults="Past events will show up here."
        />
      ),
    },
    unconfirmed: {
      title: (
        <Trans
          i18nKey="unconfirmedEventsEmptyStateTitle"
          defaults="No unconfirmed events"
        />
      ),
      description: (
        <Trans
          i18nKey="unconfirmedEventsEmptyStateDescription"
          defaults="Unconfirmed events will show up here."
        />
      ),
    },
    canceled: {
      title: (
        <Trans
          i18nKey="canceledEventsEmptyStateTitle"
          defaults="No canceled events"
        />
      ),
      description: (
        <Trans
          i18nKey="canceledEventsEmptyStateDescription"
          defaults="Canceled events will show up here."
        />
      ),
    },
  };

  const { title, description } = contentByStatus[status];

  return (
    <EmptyState className="h-96">
      <EmptyStateIcon>
        <CalendarIcon />
      </EmptyStateIcon>
      <EmptyStateTitle>{title}</EmptyStateTitle>
      <EmptyStateDescription>{description}</EmptyStateDescription>
    </EmptyState>
  );
}

function EventsPagination({
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

export function HomePage({
  title,
  subtitle,
  cards,
  members,
  list,
  page,
  hasNextPage,
}: {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  cards: React.ReactNode;
  members: { userId: string; name: string; image?: string }[];
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
  // to their own events.
  const showMemberFilter = space.shared;

  const { status } = eventsSearchParamsSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );

  return (
    <PageShell>
      <RefreshOnFocus />
      <PageHeader>
        <PageColumn className="pb-3">
          <PageTitle
            actions={
              <>
                {/* Phones share this row with the menu button, so they get
                    the sidebar's compact icon instead */}
                <CreateButton className="md:hidden" />
                <Link
                  href="/new"
                  className={cn(
                    buttonVariants({ variant: "primary" }),
                    "max-md:hidden",
                  )}
                >
                  <Trans i18nKey="create" defaults="Create" />
                </Link>
              </>
            }
          >
            {title}
          </PageTitle>
          {subtitle}
        </PageColumn>
      </PageHeader>
      <PageContent>
        <PageColumn className="pb-8">
          {cards}
          <PageToolbar className="pt-8">
            {/* Below sm, search takes the first row and the filters the
                full second row whatever the width. */}
            <SearchInput
              className="w-full min-w-0 sm:w-auto sm:min-w-48 sm:flex-1"
              placeholder={t("searchEventsPlaceholder", {
                defaultValue: "Search events by title...",
              })}
              startTransition={startNavigation}
            />
            <div className="flex min-w-0 flex-wrap items-center gap-2 max-sm:w-full">
              <FilterTabs
                param="status"
                value={status}
                label={t("eventsListStatusFilter", {
                  defaultValue: "Filter by status",
                })}
                options={[
                  {
                    value: "upcoming",
                    label: <Trans i18nKey="upcoming" defaults="Upcoming" />,
                  },
                  {
                    value: "past",
                    label: <Trans i18nKey="past" defaults="Past" />,
                  },
                  {
                    value: "canceled",
                    label: <Trans i18nKey="canceled" defaults="Canceled" />,
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
          </PageToolbar>
          {/* Dims only once loading outlasts the delay, so a fast change
              never flickers; restores at once when the new list lands */}
          <div
            aria-busy={isNavigating}
            className="transition-opacity duration-200 aria-busy:opacity-50 aria-busy:delay-150"
          >
            {list}
            <EventsPagination
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
