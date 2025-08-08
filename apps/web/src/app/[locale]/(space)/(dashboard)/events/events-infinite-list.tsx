"use client";

import { Icon } from "@rallly/ui/icon";
import { StickerIcon } from "lucide-react";
import React from "react";
import { Spinner } from "@/components/spinner";
import { StackedList, StackedListItem } from "@/components/stacked-list";
import { Trans } from "@/components/trans";
import { ScheduledEventListItem } from "@/features/scheduled-event/components/scheduled-event-list";
import type { Status } from "@/features/scheduled-event/schema";
import { trpc } from "@/trpc/client";

interface EventsInfiniteListProps {
  status?: Status;
  search?: string;
  member?: string;
  emptyState: React.ReactNode;
}

export function EventsInfiniteList({
  status,
  search,
  member,
  emptyState,
}: EventsInfiniteListProps) {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status: queryStatus,
  } = trpc.events.infiniteList.useInfiniteQuery(
    {
      status,
      search,
      member,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const events = data?.pages?.flatMap((page) => page.events) ?? [];

  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  const handleLoadMore = React.useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  React.useEffect(() => {
    const loadMoreElement = loadMoreRef.current;
    if (!loadMoreElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          handleLoadMore();
        }
      },
      {
        threshold: 0.1,
      },
    );

    observer.observe(loadMoreElement);

    return () => {
      observer.unobserve(loadMoreElement);
    };
  }, [handleLoadMore]);

  if (queryStatus === "pending") {
    return <Spinner />;
  }

  if (queryStatus === "error") {
    return (
      <div className="py-8 text-center text-red-600">
        Error loading events: {error?.message}
      </div>
    );
  }

  if (events.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <StackedList>
      {events.map((event) => (
        <StackedListItem key={event.id}>
          <ScheduledEventListItem
            eventId={event.id}
            floating={!event.timeZone}
            title={event.title}
            start={event.start}
            end={event.end}
            allDay={event.allDay}
            invites={event.invites}
            status={event.status}
            createdBy={event.createdBy}
          />
        </StackedListItem>
      ))}

      {hasNextPage && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2">
              <Spinner />
              <span className="text-muted-foreground text-sm">
                <Trans i18nKey="loading" defaults="Loading..." />
              </span>
            </div>
          )}
        </div>
      )}

      {!hasNextPage && data.pages.length > 1 && (
        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground text-sm">
          <Icon>
            <StickerIcon />
          </Icon>
          <Trans
            i18nKey="endOfList"
            defaults="You've reached the end of the list"
          />
        </div>
      )}
    </StackedList>
  );
}
