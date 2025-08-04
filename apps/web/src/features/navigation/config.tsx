"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart2Icon,
  CalendarIcon,
  HomeIcon,
  SettingsIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import React from "react";
import { isSpacesEnabled } from "@/features/space/constants";
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
          id: "home",
          items: [
            {
              id: "home",
              label: t("home", { defaultValue: "Home" }),
              href: "/",
              icon: HomeIcon,
              isActive: pathname === "/",
            },
          ],
        },
        {
          id: "content",
          title: t("content", { defaultValue: "Content" }),
          items: [
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
        ...(isSpacesEnabled
          ? [
              {
                id: "manage",
                title: t("manage", { defaultValue: "Manage" }),
                items: [
                  {
                    id: "settings",
                    label: t("settings", { defaultValue: "Settings" }),
                    href: "/settings",
                    icon: SettingsIcon,
                    isActive: pathname.startsWith("/settings"),
                  },
                ],
              },
            ]
          : []),
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
