"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart2Icon,
  CalendarDaysIcon,
  CalendarIcon,
  ClipboardListIcon,
  HomeIcon,
  ShapesIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import React from "react";
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
  const isEventTypesEnabled = useFeatureFlag("eventTypes");
  const isSignupSheetsEnabled = useFeatureFlag("signupSheets");
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
            ...(isEventTypesEnabled
              ? [
                  {
                    id: "event-types",
                    label: t("eventTypes", { defaultValue: "Event Types" }),
                    href: "/event-types",
                    icon: ShapesIcon,
                    isActive:
                      pathname === "/event-types" ||
                      pathname.startsWith("/event-types/"),
                  },
                ]
              : []),
            ...(isSignupSheetsEnabled
              ? [
                  {
                    id: "sheets",
                    label: t("signupSheets", {
                      defaultValue: "Sign-up Sheets",
                    }),
                    href: "/sheets",
                    icon: ClipboardListIcon,
                    isActive:
                      pathname === "/sheets" || pathname.startsWith("/sheets/"),
                  },
                ]
              : []),
          ],
        },
      ],
    }),
    [
      pathname,
      t,
      isCalendarsEnabled,
      isEventTypesEnabled,
      isSignupSheetsEnabled,
    ],
  );

  return React.useMemo(
    () => ({
      config,
    }),
    [config],
  );
};
