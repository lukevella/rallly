"use client";

import { Button } from "@rallly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Icon } from "@rallly/ui/icon";
import { ChevronDownIcon, PlusIcon } from "lucide-react";
import Image from "next/image";
import { Trans } from "@/i18n/client";
import { connectToCalendar } from "@/features/calendars/client";

export function ConnectCalendarDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Icon>
            <PlusIcon />
          </Icon>
          <Trans i18nKey="connectCalendar" defaults="Connect Calendar" />
          <Icon>
            <ChevronDownIcon />
          </Icon>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() => {
            connectToCalendar("google-calendar");
          }}
        >
          <Image
            src="/static/google-calendar.svg"
            width={16}
            height={16}
            alt="Google Calendar"
          />
          <Trans i18nKey="connectGoogleCalendar" defaults="Google Calendar" />
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            connectToCalendar("outlook");
          }}
        >
          <Image
            src="/static/outlook.svg"
            width={16}
            height={16}
            alt="Microsoft Calendar"
          />
          <Trans
            i18nKey="connectMicrosoftCalendar"
            defaults="Microsoft Calendar"
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
