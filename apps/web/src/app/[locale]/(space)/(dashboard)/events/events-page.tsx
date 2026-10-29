"use client";

import { buttonVariants } from "@rallly/ui";
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
import { FilterPills } from "@/components/filter-pills";
import { Link } from "@/components/link";
import {
  ListView,
  ListViewContent,
  ListViewHeader,
  ListViewTitle,
  ListViewTitleBar,
  ListViewToolbar,
} from "@/components/list-view";
import { MemberSelector } from "@/components/member-selector";
import { RefreshOnFocus } from "@/components/refresh-on-focus";
import { SearchInput } from "@/components/search-input";
import type { Status } from "@/features/scheduled-event/schema";
import { useSpace } from "@/features/space/client";
import { Trans, useTranslation } from "@/i18n/client";
import { EventsListSkeleton } from "./events-list";
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

export function EventsPage({
  members,
  list,
  page,
  hasNextPage,
}: {
  members: { userId: string; name: string; image?: string }[];
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
  // to their own events.
  const showMemberFilter = space.shared;

  const { status } = eventsSearchParamsSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );

  return (
    <ListView>
      <RefreshOnFocus />
      <ListViewHeader>
        <ListViewTitleBar>
          <ListViewTitle>
            <Trans i18nKey="events" defaults="Events" />
          </ListViewTitle>
        </ListViewTitleBar>
        <ListViewToolbar>
          <FilterPills
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
          <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
            <SearchInput
              className="w-auto min-w-0 flex-1 sm:w-56 sm:flex-none"
              placeholder={t("searchEventsPlaceholder", {
                defaultValue: "Search events by title...",
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
        {isNavigating ? <EventsListSkeleton /> : list}
        {isNavigating ? null : (
          <EventsPagination
            page={page}
            hasNextPage={hasNextPage}
            startTransition={startNavigation}
          />
        )}
      </ListViewContent>
    </ListView>
  );
}
