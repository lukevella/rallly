"use client";

import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { ChevronDownIcon } from "lucide-react";
import type * as React from "react";
import { AddToCalendarMenuItems } from "@/features/calendars/components/add-to-calendar-menu-items";

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
        <Trans i18nKey="addToCalendar" defaults="Add to calendar" />
        <ChevronDownIcon data-icon="inline-end" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <AddToCalendarMenuItems eventId={eventId} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
