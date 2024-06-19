"use client";
import { CalendarPlusIcon } from "lucide-react";

import { EventList } from "@/app/[locale]/(admin)/events/event-list";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/app/components/empty-state";
import { Spinner } from "@/components/spinner";
import { Trans } from "@/components/trans";
import { trpc } from "@/utils/trpc/client";

export function UpcomingEvents() {
  const { data } = trpc.scheduledEvents.list.useQuery({ period: "upcoming" });

  if (!data) {
    return <Spinner />;
  }

  if (data.length === 0) {
    return (
      <EmptyState className="h-96">
        <EmptyStateIcon>
          <CalendarPlusIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>
          <Trans
            i18nKey="upcomingEventsEmptyStateTitle"
            defaults="No Upcoming Events"
          />
        </EmptyStateTitle>
        <EmptyStateDescription>
          <Trans
            i18nKey="upcomingEventsEmptyStateDescription"
            defaults="When you schedule events, they will appear here."
          />
        </EmptyStateDescription>
      </EmptyState>
    );
  }

  return <EventList data={data} />;
}
