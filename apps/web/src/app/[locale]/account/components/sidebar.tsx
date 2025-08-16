"use client";

import { Icon } from "@rallly/ui/icon";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@rallly/ui/sidebar";
import {
  CreditCardIcon,
  LayersIcon,
  Settings2Icon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/i18n/client";
import { useFeatureFlag } from "@/lib/feature-flags/client";

export function AccountSidebarMenu() {
  const { t } = useTranslation();
  const isBillingEnabled = useFeatureFlag("billing");
  const pathname = usePathname();
  const menuItems = [
    {
      id: "profile",
      label: t("profile", { defaultValue: "Profile" }),
      icon: <UserIcon />,
      href: "/account/profile",
    },
    {
      id: "preferences",
      label: t("preferences", { defaultValue: "Preferences" }),
      icon: <Settings2Icon />,
      href: "/account/preferences",
    },
    {
      id: "spaces",
      label: t("spaces", { defaultValue: "Spaces" }),
      icon: <LayersIcon />,
      href: "/account/spaces",
    },
  ];

  if (isBillingEnabled) {
    menuItems.push({
      id: "billing",
      label: t("billing", { defaultValue: "Billing" }),
      icon: <CreditCardIcon />,
      href: "/account/billing",
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
