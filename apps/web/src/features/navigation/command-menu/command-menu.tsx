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
import {
  ArrowRightIcon,
  KeySquareIcon,
  PlusIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  BillingPageIcon,
  EventPageIcon,
  HomePageIcon,
  PageIcon,
  PollPageIcon,
  PreferencesPageIcon,
  ProfilePageIcon,
} from "@/app/components/page-icons";
import { Trans } from "@/components/trans";

import { useUser } from "@/components/user-provider";
import { useTranslation } from "@/i18n/client";
import { Icon } from "@rallly/ui/icon";
import { CommandGlobalShortcut } from "./command-global-shortcut";

function NavigationCommandLabel({
  label,
}: {
  label: string;
}) {
  return (
    <div>
      <Trans
        i18nKey="goTo"
        defaults="Go to <b>{page}</b>"
        values={{ page: label }}
        components={{ b: <b className="font-medium" /> }}
      />
    </div>
  );
}

export function CommandMenu() {
  const router = useRouter();
  const { user } = useUser();
  const { t } = useTranslation();
  const { trigger, dialogProps, dismiss } = useDialog();

  const handleSelect = (route: string) => {
    router.push(route);
    dismiss();
  };

  return (
    <>
      <CommandGlobalShortcut trigger={trigger} />
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
          <CommandGroup heading={<Trans i18nKey="polls" defaults="Actions" />}>
            <CommandItem onSelect={() => handleSelect("/new")}>
              <Icon>
                <PlusIcon />
              </Icon>
              <Trans i18nKey="createNewPoll" defaults="Create new poll" />
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => handleSelect("/")}>
              <HomePageIcon size="sm" />
              <NavigationCommandLabel label={t("home")} />
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/polls")}>
              <PollPageIcon size="sm" />
              <NavigationCommandLabel label={t("polls")} />
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/events")}>
              <EventPageIcon size="sm" />
              <NavigationCommandLabel label={t("events")} />
            </CommandItem>
          </CommandGroup>
          <CommandGroup
            heading={<Trans i18nKey="settings" defaults="Settings" />}
          >
            <CommandItem onSelect={() => handleSelect("/settings/profile")}>
              <ProfilePageIcon size="sm" />
              <NavigationCommandLabel label={t("profile")} />
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/settings/preferences")}>
              <PreferencesPageIcon size="sm" />
              <NavigationCommandLabel label={t("preferences")} />
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/settings/billing")}>
              <BillingPageIcon size="sm" />
              <NavigationCommandLabel label={t("billing")} />
            </CommandItem>
          </CommandGroup>
          {user.role === "admin" && (
            <CommandGroup
              heading={
                <Trans i18nKey="controlPanel" defaults="Control Panel" />
              }
            >
              <CommandItem onSelect={() => handleSelect("/control-panel")}>
                <PageIcon size="sm">
                  <ArrowRightIcon />
                </PageIcon>
                <NavigationCommandLabel label={t("controlPanel")} />
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect("/control-panel/users")}
              >
                <PageIcon size="sm">
                  <UsersIcon />
                </PageIcon>
                <NavigationCommandLabel
                  label={t("users", {
                    defaultValue: "Users",
                  })}
                />
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect("/control-panel/license")}
              >
                <PageIcon size="sm">
                  <KeySquareIcon />
                </PageIcon>
                <NavigationCommandLabel
                  label={t("license", {
                    defaultValue: "License",
                  })}
                />
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect("/control-panel/settings")}
              >
                <PageIcon size="sm">
                  <SettingsIcon />
                </PageIcon>
                <NavigationCommandLabel
                  label={t("settings", {
                    defaultValue: "Settings",
                  })}
                />
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
