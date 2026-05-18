"use client";

import { Badge } from "@rallly/ui/badge";
import { CardTitle } from "@rallly/ui/card";
import {
  ArmchairIcon,
  CalendarRangeIcon,
  ClockIcon,
  Link2Icon,
  MapPinIcon,
} from "lucide-react";
import {
  PageContainer,
  PageContent,
  PageHeader,
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
import { RandomGradientBar } from "@/components/random-gradient-bar";
import { Trans } from "@/i18n/client";
import { useLocale } from "@/lib/locale/client";
import type { LocationType } from "@/lib/location";
import { trpc } from "@/trpc/client";
import { formatDuration } from "@/utils/date-time-utils";

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

function EventTypeCard({
  name,
  duration,
  capacity,
  hostName,
  hostImage,
  locationType,
  locationLabel,
}: {
  name: string;
  duration: number;
  capacity: number | null;
  hostName: string;
  hostImage?: string;
  locationType: LocationType | null;
  locationLabel: string | null;
}) {
  const { locale } = useLocale();
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-card-border bg-card">
      <RandomGradientBar />
      <div className="p-3">
        <OptimizedAvatarImage size="lg" src={hostImage} name={hostName} />
        <p className="mt-2 font-medium text-muted-foreground text-sm">
          {hostName}
        </p>
        <CardTitle className="mt-2 truncate">{name}</CardTitle>
      </div>
      <div className="mt-auto p-3">
        <div className="flex flex-wrap gap-1">
          <Badge>
            <ClockIcon className="mr-1 -ml-0.5 size-4" />
            <span>{formatDuration(duration, locale)}</span>
          </Badge>
          {capacity !== null ? (
            <Badge>
              <ArmchairIcon className="mr-1 -ml-0.5 size-4" />
              <span>{capacity}</span>
            </Badge>
          ) : null}
          {locationType && locationLabel ? (
            <Badge>
              {locationType === "in_person" ? (
                <MapPinIcon className="mr-1 -ml-0.5 size-4" />
              ) : (
                <Link2Icon className="mr-1 -ml-0.5 size-4" />
              )}
              <span className="truncate">{locationLabel}</span>
            </Badge>
          ) : null}
        </div>
      </div>
    </div>
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
      </PageHeader>
      <PageContent>
        {eventTypes.length === 0 ? (
          <EventTypesEmptyState />
        ) : (
          <div className="@container">
            <div className="grid @4xl:grid-cols-3 @md:grid-cols-2 grid-cols-1 gap-4">
              {eventTypes.map((eventType) => (
                <EventTypeCard
                  key={eventType.id}
                  name={eventType.name}
                  duration={eventType.duration}
                  capacity={eventType.capacity}
                  hostName={eventType.host.name}
                  hostImage={eventType.host.image ?? undefined}
                  locationType={eventType.location?.type ?? null}
                  locationLabel={
                    eventType.location
                      ? eventType.location.type === "in_person"
                        ? eventType.location.address
                        : (eventType.location.text ?? eventType.location.url)
                      : null
                  }
                />
              ))}
            </div>
          </div>
        )}
      </PageContent>
    </PageContainer>
  );
}
