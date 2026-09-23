"use client";

import { cn } from "@rallly/ui";
import { Skeleton } from "@rallly/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { UsersIcon } from "lucide-react";
import React from "react";
import { DataList } from "@/components/data-list";
import { ListViewContent } from "@/components/list-view";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { Spinner } from "@/components/spinner";
import { EventTimeRange } from "@/features/scheduled-event/components/event-date-time";
import { ScheduledEventRowActions } from "@/features/scheduled-event/components/scheduled-event-row";
import type {
  ScheduledEventStatus,
  Status,
} from "@/features/scheduled-event/schema";
import { Trans } from "@/i18n/client";
import { CalendarDate } from "@/lib/datetime/calendar-date";
import { useDateTimeConfig } from "@/lib/datetime/client";
import type { DateInput } from "@/lib/datetime/types";
import {
  calendarDateToUTCMidnight,
  getCalendarDate,
} from "@/lib/datetime/utils";
import { getBrowserTimeZone } from "@/lib/utils/date-time-utils";
import { trpc } from "@/trpc/client";

type EventRow = {
  id: string;
  title: string;
  status: ScheduledEventStatus;
  start: DateInput;
  end: DateInput;
  allDay: boolean;
  timeZone: string | null;
  invites: { id: string }[];
  createdBy: { name: string; image?: string };
};

const columnHelper = createColumnHelper<EventRow>();

const columns = [
  columnHelper.accessor("end", {
    header: () => <Trans i18nKey="eventsListTime" defaults="Time" />,
    meta: {
      className:
        "justify-end whitespace-nowrap text-right text-muted-foreground text-sm tabular-nums",
    },
    cell: ({ row }) => (
      <EventTimeRange
        start={row.original.start}
        end={row.original.end}
        allDay={row.original.allDay}
        timeZone={row.original.timeZone}
      />
    ),
  }),
  columnHelper.accessor("title", {
    header: () => <Trans i18nKey="title" defaults="Title" />,
    cell: ({ row }) => (
      <span
        className={cn("truncate text-sm", {
          "text-muted-foreground line-through":
            row.original.status === "canceled",
        })}
      >
        {row.original.title}
      </span>
    ),
  }),
  columnHelper.accessor((event) => event.invites.length, {
    id: "attendees",
    header: () => <Trans i18nKey="eventsListAttendees" defaults="Attendees" />,
    meta: {
      className: "hidden justify-end text-muted-foreground text-sm sm:flex",
    },
    cell: ({ getValue }) => (
      <span className="flex items-center gap-1.5 tabular-nums">
        <UsersIcon aria-hidden className="size-4" />
        <span aria-hidden>{getValue()}</span>
        <span className="sr-only">
          <Trans
            i18nKey="attendeeCount"
            defaults="{count, plural, =0 {No attendees} one {1 attendee} other {# attendees}}"
            values={{ count: getValue() }}
          />
        </span>
      </span>
    ),
  }),
  columnHelper.accessor("createdBy", {
    header: () => <Trans i18nKey="eventsListHost" defaults="Host" />,
    meta: { className: "hidden sm:flex" },
    cell: ({ getValue }) => (
      <Tooltip>
        <TooltipTrigger className="relative z-10">
          <OptimizedAvatarImage
            size="sm"
            name={getValue().name}
            src={getValue().image}
          />
        </TooltipTrigger>
        <TooltipContent>{getValue().name}</TooltipContent>
      </Tooltip>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: () => <Trans i18nKey="eventsListActions" defaults="Actions" />,
    cell: ({ row }) => (
      <ScheduledEventRowActions
        eventId={row.original.id}
        status={row.original.status}
      />
    ),
  }),
];

/**
 * The calendar day an event falls on, as YYYY-MM-DD. All-day and floating
 * events are stored as UTC wall time; fixed instants use the viewer's zone.
 */
function getDayKey(event: EventRow, viewerTimeZone: string) {
  const timeZone =
    event.allDay || event.timeZone === null ? "UTC" : viewerTimeZone;
  return getCalendarDate(new Date(event.start), timeZone);
}

/**
 * Groups events by day, keeping the order the days arrive in, with all-day
 * events first within each day and the rest by start time.
 */
function groupByDay(events: EventRow[], viewerTimeZone: string) {
  const days = new Map<string, EventRow[]>();
  for (const event of events) {
    const key = getDayKey(event, viewerTimeZone);
    const day = days.get(key);
    if (day) {
      day.push(event);
    } else {
      days.set(key, [event]);
    }
  }
  const dayKeyById = new Map<string, string>();
  const sorted: EventRow[] = [];
  for (const [key, day] of days) {
    day.sort(
      (a, b) =>
        Number(b.allDay) - Number(a.allDay) ||
        new Date(a.start).getTime() - new Date(b.start).getTime(),
    );
    for (const event of day) {
      dayKeyById.set(event.id, key);
      sorted.push(event);
    }
  }
  return { sorted, dayKeyById };
}

function EventsListSkeleton() {
  return (
    <div aria-hidden className="py-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
          key={i}
          className="flex h-12 items-center gap-3 px-8"
        >
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="h-4 w-48" />
        </div>
      ))}
    </div>
  );
}

export function EventsInfiniteList({
  status,
  search,
  member,
  emptyState,
}: {
  status?: Status;
  search?: string;
  member?: string;
  emptyState: React.ReactNode;
}) {
  // Classifying upcoming/past depends on the viewer's clock and zone, so this
  // list is fetched on the client only (never server-prefetched).
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
      timeZone: getBrowserTimeZone(),
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const events = React.useMemo(
    () => data?.pages.flatMap((page) => page.events) ?? [],
    [data],
  );

  const viewerTimeZone = useDateTimeConfig().timeZone ?? getBrowserTimeZone();
  const { sorted, dayKeyById } = React.useMemo(
    () => groupByDay(events, viewerTimeZone),
    [events, viewerTimeZone],
  );

  const table = useReactTable({
    data: sorted,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (event) => event.id,
  });

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
    return (
      <ListViewContent>
        <EventsListSkeleton />
      </ListViewContent>
    );
  }

  if (queryStatus === "error") {
    return (
      <ListViewContent>
        <div className="py-8 text-center text-red-600">
          Error loading events: {error?.message}
        </div>
      </ListViewContent>
    );
  }

  if (events.length === 0) {
    return <ListViewContent>{emptyState}</ListViewContent>;
  }

  return (
    <ListViewContent>
      <DataList
        table={table}
        getGroup={(event) => {
          const key = dayKeyById.get(event.id) ?? "";
          return {
            id: key,
            label: (
              <>
                <CalendarDate
                  value={calendarDateToUTCMidnight(key)}
                  preset="weekday"
                  className="font-medium text-foreground"
                />
                <CalendarDate
                  value={calendarDateToUTCMidnight(key)}
                  preset="dateLong"
                  className="text-muted-foreground"
                />
              </>
            ),
          };
        }}
        className="grid-cols-[auto_minmax(0,1fr)_auto] sm:grid-cols-[auto_minmax(0,1fr)_auto_auto_auto]"
      />
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
    </ListViewContent>
  );
}
