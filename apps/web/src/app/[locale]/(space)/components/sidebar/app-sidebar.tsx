import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarSeparator,
} from "@rallly/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import {
  BarChart2Icon,
  CalendarIcon,
  HomeIcon,
  PlusIcon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { LogoLink } from "@/app/components/logo-link";
import { Trans } from "@/components/trans";
import { getUser } from "@/data/get-user";
import { FeedbackToggle } from "@/features/feedback/components/feedback-toggle";
import { getTranslation } from "@/i18n/server";

import { UpgradeButton } from "../upgrade-button";
import { NavItem } from "./nav-item";
import { NavUser } from "./nav-user";

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const user = await getUser();
  const { t } = await getTranslation();
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-between p-1">
          <div className="flex items-center gap-2">
            <LogoLink />
          </div>
          <div className="flex items-center gap-1">
            <FeedbackToggle />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/new">
                    <Icon>
                      <PlusIcon />
                    </Icon>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Create</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {/* <NavItem href="/spaces">
              <span className="inline-flex size-4 items-center justify-center rounded bg-violet-400 text-xs text-white">
                P
              </span>
              <span className="flex-1">Personal</span>
            </NavItem> */}
            <NavItem href="/">
              <HomeIcon className="size-4" />
              {t("home")}
            </NavItem>
            <NavItem href="/polls">
              <BarChart2Icon className="size-4" />
              {t("polls")}
            </NavItem>
            <NavItem href="/events">
              <CalendarIcon className="size-4" />
              {t("events")}
            </NavItem>
            {/* <NavItem href="/teams">
              <UsersIcon className="size-4" />
              {t("teams", { defaultValue: "Teams" })}
            </NavItem>
            <NavItem href="/settings">
              <SettingsIcon className="size-4" />
              {t("settings", { defaultValue: "Settings" })}
            </NavItem> */}
            {/* <NavItem href="/links" icon={LinkIcon} label="Links" /> */}
            {/* <NavItem href="/availability" icon={ClockIcon} label="Availability" /> */}
            {/* <NavItem href="/integrations" icon={PuzzleIcon} label="Integrations" /> */}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {!user.isPro ? (
          <>
            <div className="relative overflow-hidden rounded-xl border bg-gray-50 p-3 text-sm shadow-sm">
              <SparklesIcon className="absolute -top-4 right-0 z-0 size-16 text-gray-200" />
              <div className="relative z-10">
                <h2 className="font-semibold">
                  <Trans i18nKey="upgrade" defaults="Upgrade" />
                </h2>
                <p className="text-muted-foreground mb-3 mt-1 text-sm">
                  <Trans
                    i18nKey="upgradeToProDesc"
                    defaults="Unlock all Pro features"
                  />
                </p>
                <UpgradeButton>
                  <Button size="sm" variant="primary" className="w-full">
                    <Trans i18nKey="upgrade" defaults="Upgrade" />
                  </Button>
                </UpgradeButton>
              </div>
            </div>
            <SidebarSeparator />
          </>
        ) : null}
        <NavUser
          name={user.name}
          image={user.image}
          plan={
            user.isPro ? (
              <Trans i18nKey="planPro" defaults="Pro" />
            ) : (
              <Trans i18nKey="planFree" defaults="Free" />
            )
          }
        />
      </SidebarFooter>
    </Sidebar>
  );
}
