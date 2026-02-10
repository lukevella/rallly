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
import Image from "next/image";

import { Trans } from "@/components/trans";

export function AddToCalendarButton({ eventId }: { eventId: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Icon>
            <PlusIcon />
          </Icon>
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
            <Image
              src="/static/google-calendar.svg"
              width={16}
              height={16}
              alt="Google Calendar"
            />
            Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={`/api/event/${eventId}/office365`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/static/microsoft-365.svg"
              width={16}
              height={16}
              alt="Microsoft 365"
            />
            <Trans i18nKey="microsoft365" defaults="Microsoft 365" />
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={`/api/event/${eventId}/outlook`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/static/outlook.svg"
              width={16}
              height={16}
              alt="Outlook"
            />
            <Trans i18nKey="outlook" defaults="Outlook" />
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={`/api/event/${eventId}/yahoo`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image src="/static/yahoo.svg" width={16} height={16} alt="Yahoo" />
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
