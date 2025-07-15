"use client";

import { Icon } from "@rallly/ui/icon";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@rallly/ui/sidebar";
import { BarChart2Icon, CalendarIcon, HomeIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/i18n/client";

const useSpaceMenuItems = () => {
  const { t } = useTranslation();
  return [
    {
      href: "/",
      icon: <HomeIcon />,
      label: t("home", { defaultValue: "Home" }),
    },
    {
      href: "/polls",
      icon: <BarChart2Icon />,
      label: t("polls", { defaultValue: "Polls" }),
    },
    {
      href: "/events",
      icon: <CalendarIcon />,
      label: t("events", { defaultValue: "Events" }),
    },
  ];
};

export function SpaceSidebarMenu() {
  const items = useSpaceMenuItems();
  const pathname = usePathname();
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton asChild isActive={pathname === item.href}>
            <Link href={item.href}>
              <Icon>{item.icon}</Icon>
              {item.label}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
