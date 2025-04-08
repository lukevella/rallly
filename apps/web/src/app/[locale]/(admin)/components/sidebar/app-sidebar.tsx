import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
} from "@rallly/ui/sidebar";
import {
  BarChart2Icon,
  CalendarIcon,
  HomeIcon,
  SettingsIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { getTranslation } from "@/i18n/server";

import { NavItem } from "./nav-item";

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { t } = await getTranslation();
  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <Link
          className="inline-block transition-transform active:translate-y-1"
          href="/"
        >
          <Image
            src="/images/logo-mark.svg"
            alt="Rallly"
            width={32}
            height={32}
            priority={true}
            className="shrink-0"
          />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <NavItem href="/" icon={<HomeIcon />} label={t("home")} />
            <NavItem
              href="/polls"
              icon={<BarChart2Icon />}
              label={t("polls")}
            />
            <NavItem
              href="/events"
              icon={<CalendarIcon />}
              label={t("events")}
            />
            <NavItem
              href="/settings/profile"
              icon={<SettingsIcon />}
              label={t("settings")}
            />
            {/* <NavItem href="/links" icon={LinkIcon} label="Links" /> */}
            {/* <NavItem href="/availability" icon={ClockIcon} label="Availability" /> */}
            {/* <NavItem href="/team" icon={UsersIcon} label="Team" /> */}
            {/* <NavItem href="/integrations" icon={PuzzleIcon} label="Integrations" /> */}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
