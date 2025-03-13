"use client";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@rallly/ui/sidebar";
import {
  HomeIcon,
  BarChart2Icon,
  CalendarIcon,
  SettingsIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Icon } from "@rallly/ui/icon";
import { usePathname } from "next/navigation";

function NavItem({
  href,
  icon: NavItemIcon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
        <Link href={href}>
          <Icon>
            <NavItemIcon />
          </Icon>
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function NavMain() {
  return (
    <SidebarMenu>
      <NavItem href="/" icon={HomeIcon} label="Home" />
      <NavItem href="/polls" icon={BarChart2Icon} label="Polls" />
      <NavItem href="/events" icon={CalendarIcon} label="Events" />
      <NavItem href="/settings/profile" icon={SettingsIcon} label="Settings" />
    </SidebarMenu>
  );
}
