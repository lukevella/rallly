import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
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
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import * as React from "react";

import { LogoLink } from "@/app/components/logo-link";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { getUser } from "@/data/get-user";
import { getTranslation } from "@/i18n/server";

import { UserDropdown } from "../user-dropdown";
import { NavItem } from "./nav-item";

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
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-sm hover:bg-gray-200 data-[state=open]:bg-gray-200">
            <OptimizedAvatarImage
              src={user.image ?? undefined}
              name={user.name}
              size="xs"
            />
            <span className="flex-1 text-left">{user.name}</span>
            <Icon>
              <ChevronsUpDownIcon />
            </Icon>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[var(--radix-dropdown-menu-trigger-width)]"
            align="start"
          >
            <DropdownMenuLabel>Teams</DropdownMenuLabel>
            <DropdownMenuCheckboxItem checked>
              <OptimizedAvatarImage
                src={user.image ?? undefined}
                name={user.name}
                size="xs"
              />
              <span>{user.name}</span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Icon>
                <PlusIcon />
              </Icon>
              <span>New Team</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
        <UserDropdown
          name={user.name}
          image={user.image ?? undefined}
          email={user.email}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
