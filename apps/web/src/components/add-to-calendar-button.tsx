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
import GoogleCalendarIcon from "@/features/calendars/assets/google-calendar.svg";
import Microsoft365Icon from "@/features/calendars/assets/microsoft-365.svg";
import OutlookIcon from "@/features/calendars/assets/outlook.svg";
import YahooIcon from "@/features/calendars/assets/yahoo.svg";

import { Trans } from "@/i18n/client";

export function AddToCalendarButton({ eventId }: { eventId: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <PlusIcon data-icon="inline-start" />
          <Trans i18nKey="addToCalendar" defaults="Add to Calendar" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent forceMount={true} align="start">
        <DropdownMenuItem asChild>
          <a
            href={`/api/event/${eventId}/google-calendar`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <GoogleCalendarIcon className="size-4" />
            Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={`/api/event/${eventId}/office365`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Microsoft365Icon className="size-4" />
            <Trans i18nKey="microsoft365" defaults="Microsoft 365" />
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={`/api/event/${eventId}/outlook`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <OutlookIcon className="size-4" />
            <Trans i18nKey="outlook" defaults="Outlook" />
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={`/api/event/${eventId}/yahoo`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <YahooIcon className="size-4" />
            <Trans i18nKey="yahoo" defaults="Yahoo" />
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={`/api/event/${eventId}/ics`} download>
            <Icon>
              <DownloadIcon />
            </Icon>
            <Trans i18nKey="downloadICSFile" defaults="Download ICS File" />
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
