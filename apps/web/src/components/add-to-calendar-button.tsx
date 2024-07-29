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
import {
  CalendarEvent,
  google,
  ics,
  office365,
  outlook,
  yahoo,
} from "calendar-link";
import { DownloadIcon, PlusIcon } from "lucide-react";
import Image from "next/image";

import { Trans } from "@/components/trans";

export function AddToCalendarButton({
  title,
  description,
  location,
  start,
  duration,
  organizer,
  guests,
}: {
  title: string;
  description?: string;
  location?: string;
  start: Date;
  duration: number;
  organizer?: {
    name: string;
    email: string;
  };
  guests?: string[];
}) {
  const calendarEvent: CalendarEvent = {
    title,
    description,
    start,
    allDay: duration === 0,
    duration: duration > 0 ? [duration, "minutes"] : undefined,
    location,
    organizer,
    guests,
    busy: true,
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          onClick={() => {
            const res = ics(calendarEvent);

            // download the file
            const blob = new Blob([res], { type: "text/calendar" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute(
              "download",
              `${title.toLocaleLowerCase().replace(/\s/g, "-")}.ics`,
            );
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
        >
          <Icon>
            <PlusIcon />
          </Icon>
          <Trans i18nKey="addToCalendar" defaults="Add to Calendar" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent forceMount={true} align="start">
        <DropdownMenuItem
          onClick={() => {
            const res = google(calendarEvent);
            window.open(res, "_blank");
          }}
        >
          <Image
            src="/static/google-calendar.svg"
            width={16}
            height={16}
            alt="Google Calendar"
          />
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            const res = office365(calendarEvent);
            window.open(res, "_blank");
          }}
        >
          <Image
            src="/static/microsoft-365.svg"
            width={16}
            height={16}
            alt="Microsoft 365"
          />
          <Trans i18nKey="microsoft365" defaults="Microsoft 365" />
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            const res = outlook(calendarEvent);
            window.open(res, "_blank");
          }}
        >
          <Image
            src="/static/outlook.svg"
            width={16}
            height={16}
            alt="Outlook"
          />
          <Trans i18nKey="outlook" defaults="Outlook" />
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            const res = yahoo(calendarEvent);
            window.open(res, "_blank");
          }}
        >
          <Image src="/static/yahoo.svg" width={16} height={16} alt="Yahoo" />
          <Trans i18nKey="yahoo" defaults="Yahoo" />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Icon>
            <DownloadIcon />
          </Icon>
          <Trans i18nKey="downloadICSFile" defaults="Download ICS File" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
