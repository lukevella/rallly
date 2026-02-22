"use client";

import { CalendarIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import type React from "react";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageSkeleton,
  PageTitle,
} from "@/app/components/page-layout";
import { SearchInput } from "@/app/components/search-input";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { MemberSelector } from "@/components/member-selector";
import type { Status } from "@/features/scheduled-event/schema";
import { Trans, useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";
import { EventsInfiniteList } from "./events-infinite-list";
import { EventsTabbedView } from "./events-tabbed-view";
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
          defaults="No Upcoming Events"
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
        <Trans i18nKey="pastEventsEmptyStateTitle" defaults="No Past Events" />
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
          defaults="No Unconfirmed Events"
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
          defaults="No Canceled Events"
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

function EventsPageContent() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [members] = trpc.space.members.useSuspenseQuery();

  const { status, q, member } = eventsSearchParamsSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <Trans i18nKey="events" defaults="Events" />
        </PageTitle>
      </PageHeader>
      <PageContent>
        <EventsTabbedView>
          <div className="mb-4 flex gap-x-2">
            <SearchInput
              placeholder={t("searchEventsPlaceholder", {
                defaultValue: "Search events by title...",
              })}
            />
            <MemberSelector members={members} />
          </div>
          <EventsInfiniteList
            status={status}
            search={q}
            member={member}
            emptyState={<EventsEmptyState status={status || "upcoming"} />}
          />
        </EventsTabbedView>
      </PageContent>
    </PageContainer>
  );
}

export const EventsPage = dynamic(() => Promise.resolve(EventsPageContent), {
  ssr: false,
  loading: () => <PageSkeleton />,
});
