"use client";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@rallly/ui/sidebar";
import type { LucideIcon } from "lucide-react";
import { BarChart2Icon, CalendarIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
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
        <Link href={href} className="group">
          <NavItemIcon className="size-4" />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function NavMain() {
  return (
    <SidebarMenu>
      <NavItem href="/" icon={SearchIcon} label="Search" />
      {/* <NavItem href="/links" icon={LinkIcon} label="Links" /> */}
      <NavItem href="/polls" icon={BarChart2Icon} label="Polls" />
      <NavItem href="/events" icon={CalendarIcon} label="Events" />
      {/* <NavItem href="/availability" icon={ClockIcon} label="Availability" /> */}
      {/* <NavItem href="/team" icon={UsersIcon} label="Team" /> */}
      {/* <NavItem href="/integrations" icon={PuzzleIcon} label="Integrations" /> */}
    </SidebarMenu>
  );
}
