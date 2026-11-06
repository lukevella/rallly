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
import { SEARCH_INDEX_STALE_TIME } from "@/features/navigation/constants";
import { useSpace } from "@/features/space/client";
import { useTranslation } from "@/i18n/client";
import { useFeatureFlag } from "@/lib/feature-flags/client";
import { trpc } from "@/trpc/client";

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

type CommandMenuContextValue = {
  open: () => void;
};

export const CommandMenuContext =
  React.createContext<CommandMenuContextValue | null>(null);

export const useCommandMenu = () => {
  const context = React.useContext(CommandMenuContext);
  if (!context) {
    throw new Error("useCommandMenu must be used within a CommandMenuProvider");
  }
  return context;
};

// Warms the command menu's search index before it opens, so the first
// keystroke already filters locally.
export const useSearchIndexPrefetch = () => {
  const utils = trpc.useUtils();
  const { data: space } = useSpace();
  const spaceId = space.id;
  return React.useCallback(() => {
    void utils.search.index.prefetch(
      { spaceId },
      { staleTime: SEARCH_INDEX_STALE_TIME },
    );
  }, [utils, spaceId]);
};
