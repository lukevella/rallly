"use client";

import { Icon } from "@rallly/ui/icon";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@rallly/ui/sidebar";
import {
  BoltIcon,
  CalendarIcon,
  CreditCardIcon,
  KeyIcon,
  LockIcon,
  PanelsTopLeftIcon,
  Settings2Icon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/i18n/client";
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
          <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)}>
            <Link href={item.href} className="flex items-center gap-x-2">
              <Icon>{item.icon}</Icon>
              {item.label}
            </Link>
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
    {
      id: "apiKeys",
      label: t("apiKeys", { defaultValue: "API Keys" }),
      icon: <KeyIcon />,
      href: "/settings/api-keys",
    },
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
          <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)}>
            <Link href={item.href} className="flex items-center gap-x-2">
              <Icon>{item.icon}</Icon>
              {item.label}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
