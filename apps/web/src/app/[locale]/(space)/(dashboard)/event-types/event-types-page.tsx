"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@rallly/ui/card";
import { Icon } from "@rallly/ui/icon";
import {
  CalendarRangeIcon,
  ClockIcon,
  LinkIcon,
  MapPinIcon,
  UserIcon,
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
import type { EventTypeDTO } from "@/features/event-types/types";
import { Trans } from "@/i18n/client";
import { useLocale } from "@/lib/locale/client";
import type { Location } from "@/lib/location";
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

function LocationSummary({ location }: { location: Location | null }) {
  if (!location) {
    return null;
  }

  if (location.type === "in_person") {
    return (
      <span className="inline-flex items-center gap-2 truncate">
        <Icon>
          <MapPinIcon />
        </Icon>
        <span className="truncate">{location.address}</span>
      </span>
    );
  }

  const label = location.text ?? location.url;
  return (
    <span className="inline-flex items-center gap-2 truncate">
      <Icon>
        <LinkIcon />
      </Icon>
      <span className="truncate">{label}</span>
    </span>
  );
}

function EventTypeCard({ eventType }: { eventType: EventTypeDTO }) {
  const { locale } = useLocale();
  return (
    <Card className="flex h-full flex-col">
      <RandomGradientBar />
      <CardHeader>
        <OptimizedAvatarImage
          size="lg"
          src={eventType.host.image ?? undefined}
          name={eventType.host.name}
        />
        <p className="mt-2 font-medium text-muted-foreground text-sm">
          {eventType.host.name}
        </p>
        <CardTitle className="mt-2 truncate">{eventType.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2 pt-0 text-muted-foreground text-sm">
        <div className="flex items-center gap-2">
          <Icon>
            <ClockIcon />
          </Icon>
          <span>{formatDuration(eventType.duration, locale)}</span>
        </div>
        {eventType.capacity !== null ? (
          <div className="flex items-center gap-2">
            <Icon>
              <UserIcon />
            </Icon>
            <span>{eventType.capacity}</span>
          </div>
        ) : null}
        {eventType.location ? (
          <LocationSummary location={eventType.location} />
        ) : null}
      </CardContent>
    </Card>
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
                <EventTypeCard key={eventType.id} eventType={eventType} />
              ))}
            </div>
          </div>
        )}
      </PageContent>
    </PageContainer>
  );
}
