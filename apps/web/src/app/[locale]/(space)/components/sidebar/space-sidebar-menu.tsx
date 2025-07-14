"use client";

import { useTranslation } from "@/i18n/client";
import { Icon } from "@rallly/ui/icon";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@rallly/ui/sidebar";
import { BarChart2Icon, CalendarIcon, HomeIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

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

export default function SpaceSidebarMenu() {
  const items = useSpaceMenuItems();
  const pathname = usePathname();
  const [selected, setSelected] = React.useState(pathname);
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton asChild isActive={selected === item.href}>
            <Link onClick={() => setSelected(item.href)} href={item.href}>
              <Icon>{item.icon}</Icon>
              {item.label}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
