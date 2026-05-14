"use client";

import { buttonVariants } from "@rallly/ui";
import { Icon } from "@rallly/ui/icon";
import {
  CalendarRangeIcon,
  ClockIcon,
  LinkIcon,
  MapPinIcon,
  PlusIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageTitle,
} from "@/app/components/page-layout";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { StackedList, StackedListItem } from "@/components/stacked-list";
import type { EventTypeDTO } from "@/features/event-types/types";
import { Trans } from "@/i18n/client";
import { dayjs } from "@/lib/dayjs";
import type { Location } from "@/lib/location";
import { trpc } from "@/trpc/client";

function EventTypesEmptyState() {
  return (
    <EmptyState className="p-8">
      <EmptyStateIcon>
        <CalendarRangeIcon />
      </EmptyStateIcon>
      <EmptyStateTitle>
        <Trans i18nKey="eventTypesEmptyTitle" defaults="No event types yet" />
      </EmptyStateTitle>
      <EmptyStateDescription>
        <Trans
          i18nKey="eventTypesEmptyDescription"
          defaults="Create reusable event types that people can book with you."
        />
      </EmptyStateDescription>
    </EmptyState>
  );
}

function LocationSummary({ location }: { location: Location | null }) {
  if (!location) {
    return null;
  }

  if (location.type === "in_person") {
    return (
      <span className="inline-flex items-center gap-1 truncate">
        <Icon>
          <MapPinIcon />
        </Icon>
        <span className="truncate">{location.address}</span>
      </span>
    );
  }

  const label = location.text ?? location.url;
  return (
    <span className="inline-flex items-center gap-1 truncate">
      <Icon>
        <LinkIcon />
      </Icon>
      <span className="truncate">{label}</span>
    </span>
  );
}

function EventTypeRow({ eventType }: { eventType: EventTypeDTO }) {
  return (
    <Link
      href={`/event-types/${eventType.id}/edit`}
      className="flex w-full flex-col gap-2"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-sm">{eventType.name}</div>
          <div className="mt-1 flex items-center gap-2 text-muted-foreground text-xs">
            <OptimizedAvatarImage
              size="sm"
              src={eventType.host.image ?? undefined}
              name={eventType.host.name}
            />
            <span className="truncate">{eventType.host.name}</span>
          </div>
        </div>
        <div className="hidden shrink-0 flex-wrap items-center justify-end gap-x-4 gap-y-1 text-muted-foreground text-xs sm:flex">
          <span className="inline-flex items-center gap-1">
            <Icon>
              <ClockIcon />
            </Icon>
            <Trans
              i18nKey="eventTypeDurationMinutes"
              defaults="{count, plural, one {# minute} other {# minutes}}"
              values={{ count: eventType.duration }}
            />
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon>
              <UsersIcon />
            </Icon>
            {eventType.capacity === null ? (
              <Trans
                i18nKey="eventTypeCapacityUnlimited"
                defaults="Unlimited"
              />
            ) : (
              <Trans
                i18nKey="eventTypeCapacityCount"
                defaults="{count, plural, one {# person} other {# people}}"
                values={{ count: eventType.capacity }}
              />
            )}
          </span>
          {eventType.location ? (
            <LocationSummary location={eventType.location} />
          ) : null}
          <span className="whitespace-nowrap">
            <Trans
              i18nKey="eventTypeUpdatedRelative"
              defaults="Updated {relativeTime}"
              values={{ relativeTime: dayjs(eventType.updatedAt).fromNow() }}
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function EventTypesPage() {
  const [{ eventTypes }] = trpc.eventTypes.list.useSuspenseQuery();

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>
            <Trans i18nKey="eventTypes" defaults="Event Types" />
          </PageTitle>
        </PageHeaderContent>
        <PageHeaderActions>
          <Link
            href="/event-types/create"
            className={buttonVariants({ variant: "primary" })}
          >
            <PlusIcon data-icon="inline-start" />
            <Trans i18nKey="eventTypesNew" defaults="New Event Type" />
          </Link>
        </PageHeaderActions>
      </PageHeader>
      <PageContent>
        {eventTypes.length === 0 ? (
          <EventTypesEmptyState />
        ) : (
          <StackedList>
            {eventTypes.map((eventType) => (
              <StackedListItem key={eventType.id}>
                <EventTypeRow eventType={eventType} />
              </StackedListItem>
            ))}
          </StackedList>
        )}
      </PageContent>
    </PageContainer>
  );
}
