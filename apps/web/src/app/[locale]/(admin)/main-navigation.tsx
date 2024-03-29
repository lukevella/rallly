"use client";

import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import {
  BarChart2Icon,
  HomeIcon,
  LifeBuoyIcon,
  LogInIcon,
  Settings2Icon,
  SparklesIcon,
  SquarePenIcon,
} from "lucide-react";
import Link from "next/link";

import {
  Sidebar,
  SidebarMenu,
  SidebarMenuItemIcon,
  SidebarMenuLink,
  SidebarSection,
} from "@/app/[locale]/(admin)/sidebar-layout";
import { UserMenu } from "@/app/[locale]/(admin)/user-menu";
import { ProBadge } from "@/components/pro-badge";
import { Trans } from "@/components/trans";
import { IfGuest } from "@/components/user-provider";
import { IfFreeUser } from "@/contexts/plan";

export function MainSidebar() {
  return (
    <Sidebar>
      <SidebarSection>
        <SidebarMenu>
          <SidebarMenuLink href="/home">
            <SidebarMenuItemIcon>
              <HomeIcon />
            </SidebarMenuItemIcon>
            <Trans i18nKey="home" defaults="Home" />
          </SidebarMenuLink>
          <SidebarMenuLink href="/polls">
            <SidebarMenuItemIcon>
              <BarChart2Icon />
            </SidebarMenuItemIcon>
            <Trans i18nKey="polls" defaults="Polls" />
          </SidebarMenuLink>
        </SidebarMenu>
      </SidebarSection>
      <SidebarSection>
        <Button className="w-full rounded-full" variant="primary" asChild>
          <Link href="/new">
            <Icon>
              <SquarePenIcon />
            </Icon>
            <Trans i18nKey="create" defaults="Create" />
          </Link>
        </Button>
      </SidebarSection>
      <SidebarSection className="mt-auto">
        <IfFreeUser>
          <SidebarMenu>
            <li>
              <Link
                href="/settings/billing"
                className="mb-4 grid rounded-md border border-gray-200 bg-gray-50 px-4 py-3 hover:border-gray-300 hover:bg-gray-200 active:bg-gray-300"
              >
                <span className="mb-2 flex items-center gap-x-2">
                  <SparklesIcon className="size-5 text-gray-400" />
                  <span className="text-sm font-bold">
                    <Trans i18nKey="upgrade" />
                  </span>
                  <ProBadge />
                </span>
                <span className="text-sm leading-relaxed text-gray-500">
                  <Trans
                    i18nKey="unlockFeatures"
                    defaults="Unlock all Pro features."
                  />
                </span>
              </Link>
            </li>
          </SidebarMenu>
        </IfFreeUser>
        <SidebarMenu>
          <IfGuest>
            <SidebarMenuLink href="/login">
              <SidebarMenuItemIcon>
                <LogInIcon />
              </SidebarMenuItemIcon>
              <Trans i18nKey="login" />
            </SidebarMenuLink>
          </IfGuest>
          <SidebarMenuLink href="https://support.rallly.co">
            <SidebarMenuItemIcon>
              <LifeBuoyIcon />
            </SidebarMenuItemIcon>
            <Trans i18nKey="support" defaults="Support" />
          </SidebarMenuLink>
          <SidebarMenuLink href="/settings/preferences">
            <SidebarMenuItemIcon>
              <Settings2Icon />
            </SidebarMenuItemIcon>
            <Trans i18nKey="preferences" defaults="Preferences" />
          </SidebarMenuLink>
        </SidebarMenu>
      </SidebarSection>
      <SidebarSection>
        <SidebarMenu>
          <UserMenu />
        </SidebarMenu>
      </SidebarSection>
    </Sidebar>
  );
}
