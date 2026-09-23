"use client";

import { CalendarIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type React from "react";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { FilterPills } from "@/components/filter-pills";
import {
  ListView,
  ListViewHeader,
  ListViewTitle,
  ListViewTitleBar,
  ListViewToolbar,
} from "@/components/list-view";
import { MemberSelector } from "@/components/member-selector";
import { SearchInput } from "@/components/search-input";
import type { Status } from "@/features/scheduled-event/schema";
import { useSpace } from "@/features/space/client";
import { Trans, useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";
import { EventsInfiniteList } from "./events-infinite-list";
import { eventsSearchParamsSchema } from "./schema";

function EventsEmptyState({ status }: { status: Status }) {
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

export function EventsPage() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { data: space } = useSpace();
  const [{ data: members }] = trpc.spaces.listMembers.useSuspenseQuery();
  // Filtering by member is pointless when the space restricts this member
  // to their own events.
  const showMemberFilter = space.shared;

  const { status, q, member } = eventsSearchParamsSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );
  // Ignore a member URL param when the filter is hidden — a bookmarked
  // ?member= URL would otherwise show an empty list with no visible
  // control to clear it.
  const visibleMember = showMemberFilter ? member : undefined;

  return (
    <ListView>
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
          />
          <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
            <SearchInput
              className="w-auto min-w-0 flex-1 sm:w-56 sm:flex-none"
              placeholder={t("searchEventsPlaceholder", {
                defaultValue: "Search events by title...",
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
      <EventsInfiniteList
        status={status}
        search={q}
        member={visibleMember}
        emptyState={<EventsEmptyState status={status} />}
      />
    </ListView>
  );
}
