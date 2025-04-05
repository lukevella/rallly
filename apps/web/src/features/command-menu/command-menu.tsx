"use client";

import { Button } from "@rallly/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@rallly/ui/command";
import { useDialog } from "@rallly/ui/dialog";
import { Icon } from "@rallly/ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import {
  BarChart2Icon,
  CalendarIcon,
  CreditCardIcon,
  SearchIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Trans } from "@/components/trans";

import { CommandGlobalShortcut } from "./command-global-shortcut";

export function CommandMenu() {
  const router = useRouter();
  const { trigger, dialogProps, dismiss } = useDialog();

  const handleSelect = (route: string) => {
    router.push(route);
    dismiss();
  };

  return (
    <>
      <CommandGlobalShortcut trigger={trigger} />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-lg" onClick={trigger}>
            <Icon>
              <SearchIcon />
            </Icon>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <Trans i18nKey="search" defaults="Search" />
        </TooltipContent>
      </Tooltip>
      <CommandDialog {...dialogProps}>
        <CommandInput
          autoFocus={true}
          placeholder="Type a command or search..."
        />
        <CommandList className="max-h-max">
          <CommandEmpty>
            <span>
              <Trans i18nKey="commandMenuNoResults" defaults="No results" />
            </span>
          </CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => handleSelect("/polls")}>
              <Icon>
                <BarChart2Icon />
              </Icon>
              <Trans i18nKey="polls" defaults="Group Polls" />
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/events")}>
              <Icon>
                <CalendarIcon />
              </Icon>
              <Trans i18nKey="events" defaults="Events" />
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem onSelect={() => handleSelect("/settings/profile")}>
              <Icon>
                <UserIcon />
              </Icon>
              <Trans i18nKey="profile" defaults="Profile" />
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/settings/preferences")}>
              <Icon>
                <SettingsIcon />
              </Icon>
              <Trans i18nKey="preferences" defaults="Preferences" />
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/settings/billing")}>
              <Icon>
                <CreditCardIcon />
              </Icon>
              <Trans i18nKey="billing" defaults="Billing" />
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
