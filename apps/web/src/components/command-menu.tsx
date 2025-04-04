"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItemShortcut,
  CommandList,
  CommandSeparator,
} from "@rallly/ui/command";
import { Icon } from "@rallly/ui/icon";
import {
  CalendarIcon,
  CreditCardIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { GroupPollIcon } from "@/app/[locale]/(admin)/app-card";
import { Trans } from "@/components/trans";

export function CommandMenu() {
  const router = useRouter();

  return (
    <Command className="border">
      <CommandInput
        autoFocus={true}
        placeholder="Type a command or search..."
      />
      <CommandList className="max-h-max">
        <CommandEmpty>
          <span>No results found.</span>
        </CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItemShortcut onSelect={() => router.push("/polls")}>
            <GroupPollIcon size="xs" />
            <Trans i18nKey="polls" defaults="Polls" />
          </CommandItemShortcut>
          <CommandItemShortcut onSelect={() => router.push("/events")}>
            <Icon>
              <CalendarIcon />
            </Icon>
            <Trans i18nKey="events" defaults="Events" />
          </CommandItemShortcut>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItemShortcut
            onSelect={() => router.push("/settings/profile")}
          >
            <Icon>
              <UserIcon />
            </Icon>
            <Trans i18nKey="profile" defaults="Profile" />
          </CommandItemShortcut>
          <CommandItemShortcut
            onSelect={() => router.push("/settings/preferences")}
          >
            <Icon>
              <SettingsIcon />
            </Icon>
            <Trans i18nKey="preferences" defaults="Preferences" />
          </CommandItemShortcut>
          <CommandItemShortcut
            onSelect={() => router.push("/settings/billing")}
          >
            <Icon>
              <CreditCardIcon />
            </Icon>
            <Trans i18nKey="billing" defaults="Billing" />
          </CommandItemShortcut>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
