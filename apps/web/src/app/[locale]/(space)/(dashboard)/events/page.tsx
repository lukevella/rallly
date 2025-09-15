import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { CalendarIcon } from "lucide-react";
import type { Metadata } from "next";
import type { Params } from "@/app/[locale]/types";
import {
  PageContainer,
  PageContent,
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
import { Trans } from "@/components/trans";
import type { Status } from "@/features/scheduled-event/schema";
import { loadMembers } from "@/features/space/data";
import { getTranslation } from "@/i18n/server";
import { createSSRHelper } from "@/trpc/server/create-ssr-helper";
import { MemberSelector } from "../../../../../components/member-selector";
import { EventsInfiniteList } from "./events-infinite-list";
import { EventsTabbedView } from "./events-tabbed-view";
import { eventsSearchParamsSchema } from "./schema";

async function loadData({
  status,
  search,
  member,
}: {
  status?: Status;
  search?: string;
  member?: string;
}) {
  const helpers = await createSSRHelper();

  const [members] = await Promise.all([
    loadMembers(),
    // Prefetch the first page of events in parallel
    helpers.events.infiniteList.prefetchInfinite({
      status,
      search,
      member,
    }),
  ]);

  return {
    members,
    dehydratedState: dehydrate(helpers.queryClient),
  };
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
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const { t } = await getTranslation(params.locale);

  const { status, q, member } = eventsSearchParamsSchema.parse(searchParams);

  const { members, dehydratedState } = await loadData({
    status,
    search: q,
    member,
  });

  return (
    <HydrationBoundary state={dehydratedState}>
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
              <MemberSelector members={members.data} />
            </div>
            <EventsInfiniteList
              status={status}
              search={q}
              member={member}
              emptyState={
                <ScheduledEventEmptyState status={status || "upcoming"} />
              }
            />
          </EventsTabbedView>
        </PageContent>
      </PageContainer>
    </HydrationBoundary>
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
