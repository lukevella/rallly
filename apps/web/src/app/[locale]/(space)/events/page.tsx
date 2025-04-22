import { CalendarIcon } from "lucide-react";

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
import { StackedList, StackedListItem } from "@/components/stacked-list";
import { Trans } from "@/components/trans";
import { getScheduledEvents } from "@/features/scheduled-event/api/get-scheduled-events";
import { ScheduledEventListItem } from "@/features/scheduled-event/components/scheduled-event-list";
import type { Status } from "@/features/scheduled-event/schema";
import { statusSchema } from "@/features/scheduled-event/schema";
import { getTranslation } from "@/i18n/server";
import { requireUser } from "@/next-auth";

import { EventsTabbedView } from "./events-tabbed-view";

async function loadData({
  status,
  search,
}: {
  status: Status;
  search?: string;
}) {
  const { userId } = await requireUser();
  const scheduledEvents = await getScheduledEvents({
    userId,
    status,
    search,
  });
  return scheduledEvents;
}

async function ScheduledEventEmptyState({ status }: { status: Status }) {
  const { t } = await getTranslation();
  const contentByStatus = {
    upcoming: {
      title: t("noUpcomingEvents", {
        defaultValue: "No upcoming events",
      }),
      description: t("noUpcomingEventsDesc", {
        defaultValue: "Upcoming events will show up here.",
      }),
    },
    past: {
      title: t("noPastEvents", {
        defaultValue: "No past events",
      }),
      description: t("noPastEventsDesc", {
        defaultValue: "Past events will show up here.",
      }),
    },
    unconfirmed: {
      title: t("noUnconfirmedEvents", {
        defaultValue: "No unconfirmed events",
      }),
      description: t("noUnconfirmedEventsDesc", {
        defaultValue: "Unconfirmed events will show up here.",
      }),
    },
    canceled: {
      title: t("noCanceledEvents", {
        defaultValue: "No canceled events",
      }),
      description: t("noCanceledEventsDesc", {
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

export default async function Page({
  params,
  searchParams,
}: {
  params: Params;
  searchParams?: { status: string; q?: string };
}) {
  const { t } = await getTranslation(params.locale);
  const status = statusSchema.catch("upcoming").parse(searchParams?.status);
  const scheduledEvents = await loadData({ status, search: searchParams?.q });

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
        <EventsTabbedView>
          <div className="space-y-4">
            <SearchInput
              placeholder={t("searchEventsPlaceholder", {
                defaultValue: "Search events by title...",
              })}
            />
            <div className="space-y-6">
              {scheduledEvents.length === 0 && (
                <ScheduledEventEmptyState status={status} />
              )}
              {scheduledEvents.length > 0 && (
                <StackedList>
                  {scheduledEvents.map((event) => (
                    <StackedListItem key={event.id}>
                      <ScheduledEventListItem
                        eventId={event.id}
                        key={event.id}
                        floating={event.timeZone === null}
                        title={event.title}
                        start={event.start}
                        end={event.end}
                        status={event.status}
                        allDay={event.allDay}
                        invites={event.invites}
                      />
                    </StackedListItem>
                  ))}
                </StackedList>
              )}
            </div>
          </div>
        </EventsTabbedView>
      </PageContent>
    </PageContainer>
  );
}

export async function generateMetadata() {
  const { t } = await getTranslation();
  return {
    title: t("events", {
      defaultValue: "Events",
    }),
  };
}
