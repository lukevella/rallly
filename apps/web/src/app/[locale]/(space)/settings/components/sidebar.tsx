"use client";

import { useFeatureFlagEnabled } from "@rallly/posthog/client";
import { Icon } from "@rallly/ui/icon";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@rallly/ui/sidebar";
import {
  BellIcon,
  BoltIcon,
  CalendarIcon,
  CreditCardIcon,
  KeyIcon,
  LockIcon,
  PanelsTopLeftIcon,
  Settings2Icon,
  ShapesIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { HoverPrefetchLink } from "@/components/hover-prefetch-link";
import { useSpace } from "@/features/space/client";
import { useAuthedUser } from "@/features/user/client";
import { Trans, useTranslation } from "@/i18n/client";
import { useFeatureFlag } from "@/lib/feature-flags/client";

export function AccountSidebarMenu() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const menuItems = [
    {
      id: "profile",
      label: t("profile", { defaultValue: "Profile" }),
      icon: <UserIcon />,
      href: "/settings/profile",
    },
    {
      id: "security",
      label: t("security", { defaultValue: "Security" }),
      icon: <LockIcon />,
      href: "/settings/security",
    },
    {
      id: "preferences",
      label: t("preferences", { defaultValue: "Preferences" }),
      icon: <Settings2Icon />,
      href: "/settings/preferences",
    },
    {
      id: "notifications",
      label: t("notifications", { defaultValue: "Notifications" }),
      icon: <BellIcon />,
      href: "/settings/notifications",
    },
    {
      id: "spaces",
      label: t("spaces", { defaultValue: "Spaces" }),
      icon: <PanelsTopLeftIcon />,
      href: "/settings/spaces",
    },
  ];

  const isCalendarsEnabled = useFeatureFlag("calendars");

  if (isCalendarsEnabled) {
    menuItems.push({
      id: "calendars",
      label: t("calendars", { defaultValue: "Calendars" }),
      icon: <CalendarIcon />,
      href: "/settings/calendars",
    });
  }

  return (
    <SidebarMenu>
      {menuItems.map((item) => (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton
            render={
              <HoverPrefetchLink
                href={item.href}
                className="flex items-center gap-x-2"
              />
            }
            isActive={pathname.startsWith(item.href)}
          >
            {item.icon}
            {item.label}
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export function SpaceSidebarMenu() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isBillingEnabled = useFeatureFlag("billing");
  const isEventTypesEnabled = useFeatureFlag("eventTypes");
  const menuItems = [
    {
      id: "general",
      label: t("general", { defaultValue: "General" }),
      icon: <BoltIcon />,
      href: "/settings/general",
    },
    {
      id: "members",
      label: t("members", { defaultValue: "Members" }),
      icon: <UsersIcon />,
      href: "/settings/members",
    },
    ...(isEventTypesEnabled
      ? [
          {
            id: "event-types",
            label: t("eventTypes", { defaultValue: "Event Types" }),
            icon: <ShapesIcon />,
            href: "/settings/event-types",
          },
        ]
      : []),
    ...(isBillingEnabled
      ? [
          {
            id: "billing",
            label: t("billing", { defaultValue: "Billing" }),
            icon: <CreditCardIcon />,
            href: "/settings/billing",
          },
        ]
      : []),
  ];

  return (
    <SidebarMenu>
      {menuItems.map((item) => (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton
            render={
              <HoverPrefetchLink
                href={item.href}
                className="flex items-center gap-x-2"
              />
            }
            isActive={pathname.startsWith(item.href)}
          >
            <Icon>{item.icon}</Icon>
            {item.label}
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export function DeveloperSidebarMenu() {
  const { data: space } = useSpace();
  const user = useAuthedUser();
  const isSpaceOwner = space.ownerId === user.id;
  const pathname = usePathname();
  const isDeveloperToolsEnabled = useFeatureFlagEnabled("developer-tools");

  if (!isSpaceOwner || !isDeveloperToolsEnabled) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        <Trans i18nKey="developer" defaults="Developer" />
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={
                <HoverPrefetchLink
                  href="/settings/api-keys"
                  className="flex items-center gap-x-2"
                />
              }
              isActive={pathname.startsWith("/settings/api-keys")}
            >
              <Icon>
                <KeyIcon />
              </Icon>
              <Trans i18nKey="apiKeys" defaults="API Keys" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
