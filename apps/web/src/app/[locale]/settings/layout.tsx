import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import {
  ArrowLeftIcon,
  CreditCardIcon,
  Settings2Icon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { Trans } from "react-i18next/TransWithoutContext";

import {
  Sidebar,
  SidebarContent,
  SidebarLayout,
  SidebarMenu,
  SidebarMenuItemIcon,
  SidebarMenuLabel,
  SidebarMenuLink,
  SidebarNavigation,
  SidebarSection,
} from "@/app/[locale]/(admin)/sidebar-layout";
import { getTranslation } from "@/app/i18n";
import { IfCloudHosted } from "@/contexts/environment";
import { isSelfHosted } from "@/utils/constants";

export default async function ProfileLayout({
  children,
  params,
}: React.PropsWithChildren<{
  params: { locale: string };
}>) {
  const { t } = await getTranslation(params.locale);
  const menuItems = [
    {
      title: t("profile"),
      href: "/settings/profile",
      icon: UserIcon,
    },
    {
      title: t("preferences"),
      href: "/settings/preferences",
      icon: Settings2Icon,
    },
  ];

  if (!isSelfHosted) {
    menuItems.push({
      title: t("billing"),
      href: "/settings/billing",
      icon: CreditCardIcon,
    });
  }

  return (
    <SidebarLayout>
      <SidebarNavigation>
        <Sidebar>
          <SidebarSection>
            <Button variant="ghost" asChild>
              <Link href="/">
                <Icon>
                  <ArrowLeftIcon />
                </Icon>
                <Trans i18nKey="back" defaults="Back" />
              </Link>
            </Button>
          </SidebarSection>
          <SidebarSection>
            <SidebarMenuLabel>
              <Trans t={t} i18nKey="settings" />
            </SidebarMenuLabel>
            <SidebarMenu>
              <SidebarMenuLink href="/settings/profile">
                <SidebarMenuItemIcon>
                  <UserIcon />
                </SidebarMenuItemIcon>
                <Trans t-={t} i18nKey="profile" defaults="Profile" />
              </SidebarMenuLink>
              <SidebarMenuLink href="/settings/preferences">
                <SidebarMenuItemIcon>
                  <Settings2Icon />
                </SidebarMenuItemIcon>
                <Trans t={t} i18nKey="preferences" defaults="Preferences" />
              </SidebarMenuLink>
              <IfCloudHosted>
                <SidebarMenuLink href="/settings/billing">
                  <SidebarMenuItemIcon>
                    <CreditCardIcon />
                  </SidebarMenuItemIcon>
                  <Trans t={t} i18nKey="billing" defaults="Billing" />
                </SidebarMenuLink>
              </IfCloudHosted>
            </SidebarMenu>
          </SidebarSection>
        </Sidebar>
      </SidebarNavigation>
      <SidebarContent>{children}</SidebarContent>
    </SidebarLayout>
  );
}
