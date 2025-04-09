import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
} from "@rallly/ui/sidebar";
import {
  BarChart2Icon,
  CalendarIcon,
  ChevronsUpDownIcon,
  HomeIcon,
  PlusIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { LogoLink } from "@/app/components/logo-link";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { ProBadge } from "@/components/pro-badge";
import { getUser } from "@/data/get-user";
import { getTranslation } from "@/i18n/server";

import { NavItem } from "./nav-item";

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const user = await getUser();
  const { t } = await getTranslation();
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-between p-1">
          <LogoLink />
          <Button variant="ghost" size="icon" asChild>
            <Link href="/new">
              <Icon>
                <PlusIcon />
              </Icon>
            </Link>
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <NavItem href="/spaces">
              <OptimizedAvatarImage
                size="xs"
                src={user.image}
                name={user.name}
              />
              <span className="flex-1">{user.name}</span>
              {user.isPro && <ProBadge />}
              <span className="-mr-1 inline-flex size-7 items-center justify-center">
                <Icon>
                  <ChevronsUpDownIcon />
                </Icon>
              </span>
            </NavItem>
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
            <NavItem href="/members">
              <UsersIcon className="size-4" />
              {t("members", { defaultValue: "Members" })}
            </NavItem>
            {/* <NavItem href="/links" icon={LinkIcon} label="Links" /> */}
            {/* <NavItem href="/availability" icon={ClockIcon} label="Availability" /> */}
            {/* <NavItem href="/integrations" icon={PuzzleIcon} label="Integrations" /> */}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Link
          href="/settings/profile"
          className="flex w-full items-center gap-3 rounded-md p-3 text-sm hover:bg-gray-200 data-[state=open]:bg-gray-200"
        >
          <OptimizedAvatarImage size="md" src={user.image} name={user.name} />
          <div className="flex-1 truncate text-left">
            <div>{user.name}</div>
            <div className="text-muted-foreground truncate text-sm font-normal">
              {user.email}
            </div>
          </div>
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
