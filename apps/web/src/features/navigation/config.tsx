"use client";

import type { LucideIcon } from "lucide-react";
import { BarChart2Icon, CalendarIcon, HomeIcon, UsersIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import React from "react";
import { useTranslation } from "@/i18n/client";

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  children?: NavigationItem[];
  isActive?: boolean;
  external?: boolean;
}

export interface NavigationSection {
  id: string;
  title?: string;
  items: NavigationItem[];
}

export interface NavigationConfig {
  sections: NavigationSection[];
}

export const useSpaceMenu = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const config = React.useMemo<NavigationConfig>(
    () => ({
      sections: [
        {
          id: "main",
          title: t("main", { defaultValue: "Main" }),
          items: [
            {
              id: "home",
              label: t("home", { defaultValue: "Home" }),
              href: "/",
              icon: HomeIcon,
              isActive: pathname === "/",
            },
            {
              id: "polls",
              label: t("polls", { defaultValue: "Polls" }),
              href: "/polls",
              icon: BarChart2Icon,
              isActive: pathname === "/polls",
            },
            {
              id: "events",
              label: t("events", { defaultValue: "Events" }),
              href: "/events",
              icon: CalendarIcon,
              isActive: pathname === "/events",
            },
          ],
        },
        ...(process.env.NODE_ENV === "development"
          ? [
              {
                id: "manage",
                title: t("manage", { defaultValue: "Manage" }),
                items: [
                  {
                    id: "members",
                    label: t("members", { defaultValue: "Members" }),
                    href: "/members",
                    icon: UsersIcon,
                    isActive: pathname === "/members",
                  },
                ],
              },
            ]
          : []),
        // {
        //   id: "manage",
        //   title: t("manage", { defaultValue: "Manage" }),
        //   items: [
        //     {
        //       id: "members",
        //       label: t("members", { defaultValue: "Members" }),
        //       href: "/members",
        //       icon: UsersIcon,
        //       isActive: pathname === "/members",
        //     },
        //     {
        //       id: "settings",
        //       label: t("settings", { defaultValue: "Settings" }),
        //       href: "/settings",
        //       icon: SettingsIcon,
        //       isActive: pathname === "/settings",
        //     },
        //   ],
        // },
      ],
    }),
    [pathname, t],
  );

  return React.useMemo(
    () => ({
      config,
    }),
    [config],
  );
};
