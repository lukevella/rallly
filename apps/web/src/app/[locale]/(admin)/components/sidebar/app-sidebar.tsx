import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
} from "@rallly/ui/sidebar";
import { BarChart2Icon, CalendarIcon, HomeIcon, UsersIcon } from "lucide-react";
import * as React from "react";

import { LogoLink } from "@/app/components/logo-link";
import { getUser } from "@/data/get-user";
import { getTranslation } from "@/i18n/server";

import { UserDropdown } from "../user-dropdown";
import { NavItem } from "./nav-item";
import { TeamSwitcher } from "./team-switcher";

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const user = await getUser();
  const { t } = await getTranslation();
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <div className="p-1">
          <LogoLink />
        </div>
        <TeamSwitcher
          currentTeamId={user.id}
          teams={[
            {
              id: user.id,
              name: user.name,
              image: user.image ?? undefined,
              pro: user.isPro,
            },
          ]}
        />
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
              href="/members"
              icon={<UsersIcon />}
              label={t("members", { defaultValue: "Members" })}
            />
            {/* <NavItem href="/links" icon={LinkIcon} label="Links" /> */}
            {/* <NavItem href="/availability" icon={ClockIcon} label="Availability" /> */}
            {/* <NavItem href="/integrations" icon={PuzzleIcon} label="Integrations" /> */}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="-mx-1">
          <UserDropdown
            name={user.name}
            image={user.image ?? undefined}
            email={user.email}
          />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
