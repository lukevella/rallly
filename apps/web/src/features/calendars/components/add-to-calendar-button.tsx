"use client";

import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Icon } from "@rallly/ui/icon";
import { DownloadIcon, PlusIcon } from "lucide-react";
import type * as React from "react";
import GoogleCalendarIcon from "@/features/calendars/assets/google-calendar.svg";
import Microsoft365Icon from "@/features/calendars/assets/microsoft-365.svg";
import OutlookIcon from "@/features/calendars/assets/outlook.svg";
import YahooIcon from "@/features/calendars/assets/yahoo.svg";

import { Trans } from "@/i18n/client";

export function AddToCalendarButton({
  eventId,
  size,
  className,
}: {
  eventId: string;
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={<Button size={size} className={className} />}
      >
        <PlusIcon data-icon="inline-start" />
        <Trans i18nKey="addToCalendar" defaults="Add to Calendar" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          render={
            <a
              href={`/api/event/${eventId}/google-calendar`}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          <GoogleCalendarIcon className="size-4" />
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem
          render={
            <a
              href={`/api/event/${eventId}/office365`}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          <Microsoft365Icon className="size-4" />
          <Trans i18nKey="microsoft365" defaults="Microsoft 365" />
        </DropdownMenuItem>
        <DropdownMenuItem
          render={
            <a
              href={`/api/event/${eventId}/outlook`}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          <OutlookIcon className="size-4" />
          <Trans i18nKey="outlook" defaults="Outlook" />
        </DropdownMenuItem>
        <DropdownMenuItem
          render={
            <a
              href={`/api/event/${eventId}/yahoo`}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          <YahooIcon className="size-4" />
          <Trans i18nKey="yahoo" defaults="Yahoo" />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={<a href={`/api/event/${eventId}/ics`} download />}
        >
          <Icon>
            <DownloadIcon />
          </Icon>
          <Trans i18nKey="downloadICSFile" defaults="Download ICS File" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
