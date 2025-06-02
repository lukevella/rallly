import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
} from "@rallly/ui/sidebar";
import {
  ArrowLeftIcon,
  HomeIcon,
  KeySquareIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import type * as React from "react";

import { Trans } from "@/components/trans";

import { NavItem } from "./nav-item";

export async function ControlPanelSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <NavItem href="/">
            <ArrowLeftIcon className="size-4" />
            <Trans i18nKey="back" defaults="Back" />
          </NavItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <Trans i18nKey="controlPanel" defaults="Control Panel" />
          </SidebarGroupLabel>
          <SidebarMenu>
            <NavItem href="/control-panel">
              <HomeIcon className="size-4" />
              <Trans i18nKey="home" defaults="Home" />
            </NavItem>
            <NavItem href="/control-panel/users">
              <UsersIcon className="size-4" />
              <Trans i18nKey="users" defaults="Users" />
            </NavItem>
            <NavItem href="/control-panel/license">
              <KeySquareIcon className="size-4" />
              <Trans i18nKey="license" defaults="License" />
            </NavItem>
            <NavItem href="/control-panel/settings">
              <SettingsIcon className="size-4" />
              <Trans i18nKey="settings" defaults="Settings" />
            </NavItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
