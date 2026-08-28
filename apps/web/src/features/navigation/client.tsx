"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart2Icon,
  CalendarDaysIcon,
  CalendarIcon,
  HomeIcon,
  UsersIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import React from "react";
import { useSpace } from "@/features/space/client";
import { useTranslation } from "@/i18n/client";
import { useFeatureFlag } from "@/lib/feature-flags/client";

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
  const isCalendarsEnabled = useFeatureFlag("calendars");
  const { data: space } = useSpace();
  // The members page is a management surface (inviting, roles, the
  // collaboration setting); members meet the roster through in-context
  // pickers instead.
  const isAdmin = space.role === "admin";
  const config = React.useMemo<NavigationConfig>(
    () => ({
      sections: [
        {
          id: "main",
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
            ...(isCalendarsEnabled
              ? [
                  {
                    id: "calendar",
                    label: t("calendar", { defaultValue: "Calendar" }),
                    href: "/calendar",
                    icon: CalendarDaysIcon,
                    isActive: pathname === "/calendar",
                  },
                ]
              : []),
            ...(isAdmin
              ? [
                  {
                    id: "members",
                    label: t("members", { defaultValue: "Members" }),
                    href: "/members",
                    icon: UsersIcon,
                    isActive: pathname === "/members",
                  },
                ]
              : []),
          ],
        },
      ],
    }),
    [pathname, t, isCalendarsEnabled, isAdmin],
  );

  return React.useMemo(
    () => ({
      config,
    }),
    [config],
  );
};
