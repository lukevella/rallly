"use client";

import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Icon } from "@rallly/ui/icon";
import { toast } from "@rallly/ui/sonner";
import { Switch } from "@rallly/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { CalendarIcon, MoreHorizontalIcon, RefreshCcwIcon } from "lucide-react";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { Spinner } from "@/components/spinner";
import { CalendarProviderIcon } from "@/features/calendars/components/calendar-provider-icon";
import { Trans, useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";

export function CalendarConnectionList() {
  const { data: connections } = trpc.calendars.list.useQuery();
  const disconnectCalendar = trpc.calendars.disconnect.useMutation();
  const syncCalendar = trpc.calendars.sync.useMutation();
  const { t } = useTranslation();
  const setCalendarSelection = trpc.calendars.setSelection.useMutation();

  if (connections === undefined) {
    return <Spinner />;
  }

  if (connections.length === 0) {
    return (
      <EmptyState>
        <EmptyStateIcon>
          <CalendarIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>
          <Trans i18nKey="noCalendars" defaults="No calendars found" />
        </EmptyStateTitle>
        <EmptyStateDescription>
          <Trans
            i18nKey="noCalendarsDescription"
            defaults="No calendars found"
          />
        </EmptyStateDescription>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-4">
      {connections.map((calendar) => (
        <div className="space-y-4 rounded-xl border p-4" key={calendar.id}>
          <div className="flex items-center gap-x-4">
            <div>
              <CalendarProviderIcon provider={calendar.provider} size={32} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{calendar.displayName}</p>
              <p className="text-muted-foreground text-sm">{calendar.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    loading={syncCalendar.isPending}
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      toast.promise(
                        syncCalendar.mutateAsync({ id: calendar.id }),
                        {
                          loading: t("syncCalendarLoading", {
                            defaultValue: "Syncing calendar…",
                          }),
                          success: t("syncCalendarSuccess", {
                            defaultValue: "Calendar synced",
                          }),
                          error: t("syncCalendarError", {
                            defaultValue:
                              "There was an issue syncing your calendar",
                          }),
                        },
                      );
                    }}
                  >
                    <Icon>
                      <RefreshCcwIcon />
                    </Icon>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <Trans i18nKey="syncCalendar" defaults="Sync calendar" />
                </TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Icon>
                      <MoreHorizontalIcon />
                    </Icon>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => {
                      toast.promise(
                        disconnectCalendar.mutateAsync({
                          id: calendar.id,
                        }),
                        {
                          loading: t("disconnectingCalendar", {
                            defaultValue: "Disconnecting calendar...",
                          }),
                          success: t("calendarDisconnectedSuccess", {
                            defaultValue: "Calendar disconnected successfully",
                          }),
                          error: t("calendarDisconnectedError", {
                            defaultValue: "Failed to disconnect calendar",
                          }),
                        },
                      );
                    }}
                  >
                    <Trans
                      i18nKey="disconnectCalendar"
                      defaults="Disconnect calendar"
                    />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <hr />
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              <Trans
                i18nKey="checkForConflicts"
                defaults="Toggle which calendars to check for conflicts"
              />
            </p>
            <ul className="space-y-2">
              {calendar.providerCalendars.map((c) => {
                return (
                  <li key={c.id} className="flex items-center gap-x-4">
                    <Switch
                      defaultChecked={c.isSelected}
                      onCheckedChange={(checked) => {
                        toast.promise(
                          setCalendarSelection.mutateAsync({
                            calendarId: c.id,
                            isSelected: checked,
                          }),
                          {
                            loading: t("settingCalendarSelection", {
                              defaultValue: "Setting calendar selection...",
                            }),
                            success: t("calendarSelectionSetSuccess", {
                              defaultValue:
                                "Calendar selection set successfully",
                            }),
                            error: t("calendarSelectionSetError", {
                              defaultValue: "Failed to set calendar selection",
                            }),
                          },
                        );
                      }}
                    />
                    <span className="text-sm">{c.name}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
