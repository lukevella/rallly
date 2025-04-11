"use client";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@rallly/ui/command";
import { DialogDescription, DialogTitle, useDialog } from "@rallly/ui/dialog";
import { useRouter } from "next/navigation";

import {
  BillingPageIcon,
  EventPageIcon,
  HomePageIcon,
  PollPageIcon,
  PreferencesPageIcon,
  ProfilePageIcon,
  SpacesPageIcon,
  TeamsPageIcon,
} from "@/app/components/page-icons";
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

      {/* <Button variant="ghost" onClick={trigger}>
        <Icon>
          <SearchIcon />
        </Icon>
        <Trans i18nKey="search" defaults="Search" />
        <CommandShortcutSymbol symbol="K" />
      </Button> */}
      <CommandDialog {...dialogProps}>
        <DialogTitle className="sr-only">
          <Trans i18nKey="commandMenu" defaults="Command Menu" />
        </DialogTitle>
        <DialogDescription className="sr-only">
          <Trans i18nKey="commandMenuDescription" defaults="Select a command" />
        </DialogDescription>
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
            <CommandItem onSelect={() => handleSelect("/")}>
              <HomePageIcon />
              <Trans i18nKey="home" defaults="Home" />
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/polls")}>
              <PollPageIcon />
              <Trans i18nKey="polls" defaults="Group Polls" />
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/events")}>
              <EventPageIcon />
              <Trans i18nKey="events" defaults="Events" />
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/teams")}>
              <TeamsPageIcon />
              <Trans i18nKey="teams" defaults="Teams" />
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/spaces")}>
              <SpacesPageIcon />
              <Trans i18nKey="spaces" defaults="Spaces" />
            </CommandItem>
          </CommandGroup>
          <CommandGroup
            heading={<Trans i18nKey="account" defaults="Account" />}
          >
            <CommandItem onSelect={() => handleSelect("/settings/profile")}>
              <ProfilePageIcon />
              <Trans i18nKey="profile" defaults="Profile" />
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/settings/preferences")}>
              <PreferencesPageIcon />
              <Trans i18nKey="preferences" defaults="Preferences" />
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/settings/billing")}>
              <BillingPageIcon />
              <Trans i18nKey="billing" defaults="Billing" />
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
