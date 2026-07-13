"use client";

import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { CardTitle } from "@rallly/ui/card";
import { useDialog } from "@rallly/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Icon } from "@rallly/ui/icon";
import {
  ArmchairIcon,
  CalendarRangeIcon,
  ClockIcon,
  Link2Icon,
  MapPinIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import React from "react";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { RandomGradientBar } from "@/components/random-gradient-bar";
import {
  SettingsPage,
  SettingsPageAction,
  SettingsPageContent,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageTitle,
} from "@/components/settings-layout";
import { CreateEventTypeDialog } from "@/features/event-types/components/create-event-type-dialog";
import { DeleteEventTypeDialog } from "@/features/event-types/components/delete-event-type-dialog";
import { EditEventTypeDialog } from "@/features/event-types/components/edit-event-type-dialog";
import type { EventTypeDTO } from "@/features/event-types/types";
import { Trans, useTranslation } from "@/i18n/client";
import { formatDuration } from "@/lib/datetime/format";
import { useLocale } from "@/lib/locale/client";
import type { LocationType } from "@/lib/location";
import { trpc } from "@/trpc/client";

function EventTypesEmptyState({ onCreate }: { onCreate: () => void }) {
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
      <EmptyStateFooter>
        <Button variant="primary" onClick={onCreate}>
          <PlusIcon data-icon="inline-start" />
          <Trans i18nKey="newEventType" defaults="New Event Type" />
        </Button>
      </EmptyStateFooter>
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
  onEdit,
  onDelete,
}: {
  name: string;
  duration: number;
  capacity: number | null;
  hostName: string;
  hostImage?: string;
  locationType: LocationType | null;
  locationLabel: string | null;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { locale } = useLocale();
  const { t } = useTranslation();
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-card-border bg-card">
      <RandomGradientBar />
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <OptimizedAvatarImage size="md" src={hostImage} name={hostName} />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  aria-label={t("eventTypeActionsLabel", {
                    defaultValue: "Event type actions",
                  })}
                  variant="ghost"
                  size="icon"
                />
              }
            >
              <Icon>
                <MoreVerticalIcon />
              </Icon>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <PencilIcon className="size-4" />
                <Trans i18nKey="edit" defaults="Edit" />
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <Trash2Icon className="size-4" />
                <Trans i18nKey="delete" defaults="Delete" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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

export function EventTypesSettingsPage() {
  const [{ eventTypes }] = trpc.eventTypes.list.useSuspenseQuery();
  const createDialog = useDialog();
  const editDialog = useDialog();
  const deleteDialog = useDialog();
  const [selectedEventType, setSelectedEventType] =
    React.useState<EventTypeDTO | null>(null);

  return (
    <SettingsPage>
      <SettingsPageHeader>
        <SettingsPageTitle>
          <Trans i18nKey="eventTypes" defaults="Event Types" />
        </SettingsPageTitle>
        <SettingsPageDescription>
          <Trans
            i18nKey="eventTypesDescription"
            defaults="Reusable event configurations."
          />
        </SettingsPageDescription>
        <SettingsPageAction>
          <Button variant="primary" onClick={() => createDialog.trigger()}>
            <PlusIcon data-icon="inline-start" />
            <Trans i18nKey="newEventType" defaults="New Event Type" />
          </Button>
        </SettingsPageAction>
      </SettingsPageHeader>
      <SettingsPageContent>
        {eventTypes.length === 0 ? (
          <EventTypesEmptyState onCreate={() => createDialog.trigger()} />
        ) : (
          <div className="@container">
            <div className="grid @md:grid-cols-2 grid-cols-1 gap-4">
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
                  onEdit={() => {
                    setSelectedEventType(eventType);
                    editDialog.trigger();
                  }}
                  onDelete={() => {
                    setSelectedEventType(eventType);
                    deleteDialog.trigger();
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </SettingsPageContent>
      <CreateEventTypeDialog {...createDialog.dialogProps} />
      {selectedEventType ? (
        <>
          <EditEventTypeDialog
            {...editDialog.dialogProps}
            eventType={selectedEventType}
          />
          <DeleteEventTypeDialog
            {...deleteDialog.dialogProps}
            eventTypeId={selectedEventType.id}
            eventTypeName={selectedEventType.name}
          />
        </>
      ) : null}
    </SettingsPage>
  );
}
