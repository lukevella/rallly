"use client";

import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@rallly/ui/dropdown-menu";
import { DownloadIcon } from "lucide-react";
import GoogleCalendarIcon from "@/features/calendars/assets/google-calendar.svg";
import Microsoft365Icon from "@/features/calendars/assets/microsoft-365.svg";
import OutlookIcon from "@/features/calendars/assets/outlook.svg";
import YahooIcon from "@/features/calendars/assets/yahoo.svg";
import { Trans } from "@/i18n/client";

/**
 * Emits only menu items so the same calendar destinations can be rendered
 * inside a dropdown menu or nested in a submenu.
 */
export function AddToCalendarMenuItems({ eventId }: { eventId: string }) {
  return (
    <>
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
        <DownloadIcon />
        <Trans i18nKey="downloadICSFile" defaults="Download ICS file" />
      </DropdownMenuItem>
    </>
  );
}
