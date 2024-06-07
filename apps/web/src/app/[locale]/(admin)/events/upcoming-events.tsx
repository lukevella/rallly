"use client";
import { CalendarPlusIcon } from "lucide-react";

import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/app/components/empty-state";
import { trpc } from "@/app/providers";
import { Spinner } from "@/components/spinner";

export function UpcomingEvents() {
  const { data, isFetched } = trpc.events.listUpcoming.useQuery();
  if (!isFetched) {
    return <Spinner />;
  }
  if (data?.length === 0) {
    return (
      <EmptyState className="h-96">
        <EmptyStateIcon>
          <CalendarPlusIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>No upcoming events</EmptyStateTitle>
        <EmptyStateDescription>
          You do not have any events scheduled
        </EmptyStateDescription>
      </EmptyState>
    );
  }
  // Show events grouped by dAT
  return (
    <ol className="space-y-2">
      {data?.map((event) => <li key={event.id}>{event.title}</li>)}
    </ol>
  );
}
