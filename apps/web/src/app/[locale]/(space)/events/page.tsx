import { CalendarIcon } from "lucide-react";
import type { Metadata } from "next";
import type { Params } from "@/app/[locale]/types";
import { EventPageIcon } from "@/app/components/page-icons";
import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { SearchInput } from "@/app/components/search-input";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { StackedList, StackedListItem } from "@/components/stacked-list";
import { Trans } from "@/components/trans";
import { loadScheduledEvents } from "@/data/event";
import { ScheduledEventListItem } from "@/features/scheduled-event/components/scheduled-event-list";
import type { Status } from "@/features/scheduled-event/schema";
import { statusSchema } from "@/features/scheduled-event/schema";
import { getTranslation } from "@/i18n/server";
import { EventsTabbedView } from "./events-tabbed-view";

async function loadData({
  status,
  search,
  page = 1,
  pageSize = 10,
}: {
  status: Status;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  return loadScheduledEvents({
    status,
    search,
    page,
    pageSize,
  });
}

async function ScheduledEventEmptyState({ status }: { status: Status }) {
  const { t } = await getTranslation();
  const contentByStatus = {
    upcoming: {
      title: t("upcomingEventsEmptyStateTitle", {
        defaultValue: "No Upcoming Events",
      }),
      description: t("upcomingEventsEmptyStateDescription", {
        defaultValue: "When you schedule events, they will appear here.",
      }),
    },
    past: {
      title: t("pastEventsEmptyStateTitle", {
        defaultValue: "No Past Events",
      }),
      description: t("pastEventsEmptyStateDescription", {
        defaultValue: "Past events will show up here.",
      }),
    },
    unconfirmed: {
      title: t("unconfirmedEventsEmptyStateTitle", {
        defaultValue: "No Unconfirmed Events",
      }),
      description: t("unconfirmedEventsEmptyStateDescription", {
        defaultValue: "Unconfirmed events will show up here.",
      }),
    },
    canceled: {
      title: t("canceledEventsEmptyStateTitle", {
        defaultValue: "No Canceled Events",
      }),
      description: t("canceledEventsEmptyStateDescription", {
        defaultValue: "Canceled events will show up here.",
      }),
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

export default async function Page(props: {
  params: Promise<Params>;
  searchParams?: Promise<{ status: string; q?: string; page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const { t } = await getTranslation(params.locale);
  const status = statusSchema.catch("upcoming").parse(searchParams?.status);
  const pageParam = searchParams?.page;
  const page = pageParam ? Math.max(1, Number(pageParam) || 1) : 1;
  const pageSize = 10;

  const {
    events: paginatedEvents,
    totalCount,
    totalPages,
  } = await loadData({
    status,
    search: searchParams?.q,
    page,
    pageSize,
  });

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <EventPageIcon />
          <Trans i18nKey="events" defaults="Events" />
        </PageTitle>
        <PageDescription>
          <Trans
            i18nKey="eventsPageDesc"
            defaults="View and manage your scheduled events"
          />
        </PageDescription>
      </PageHeader>
      <PageContent>
        <div className="space-y-4">
          <SearchInput
            placeholder={t("searchEventsPlaceholder", {
              defaultValue: "Search events by title...",
            })}
          />
          <EventsTabbedView>
            <div className="space-y-6">
              {paginatedEvents.length === 0 && (
                <ScheduledEventEmptyState status={status} />
              )}
              {paginatedEvents.length > 0 && (
                <StackedList>
                  {paginatedEvents.map((event) => (
                    <StackedListItem key={event.id}>
                      <ScheduledEventListItem
                        eventId={event.id}
                        key={event.id}
                        floating={!event.timeZone}
                        title={event.title}
                        start={event.start}
                        end={event.end}
                        allDay={event.allDay}
                        invites={event.invites}
                        status={event.status}
                      />
                    </StackedListItem>
                  ))}
                </StackedList>
              )}
              {totalPages > 1 && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={totalCount}
                  pageSize={pageSize}
                />
              )}
            </div>
          </EventsTabbedView>
        </div>
      </PageContent>
    </PageContainer>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("events", {
      defaultValue: "Events",
    }),
  };
}
