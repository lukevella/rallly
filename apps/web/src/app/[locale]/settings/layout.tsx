import {
  ArrowLeftIcon,
  CreditCardIcon,
  Settings2Icon,
  UserIcon,
} from "lucide-react";
import React from "react";
import { Trans } from "react-i18next/TransWithoutContext";

import {
  MainContent,
  MainLayout,
  MainNavigation,
} from "@/app/[locale]/(admin)/sidebar-layout";
import {
  Sidebar,
  SidebarMenu,
  SidebarMenuItemIcon,
  SidebarMenuLabel,
  SidebarMenuLink,
  SidebarSection,
} from "@/app/[locale]/(admin)/sidebar-menu";
import { getTranslation } from "@/app/i18n";
import { IfCloudHosted } from "@/contexts/environment";

export default async function Layout({
  children,
  params,
}: React.PropsWithChildren<{
  params: { locale: string };
}>) {
  const { t } = await getTranslation(params.locale);
  return (
    <MainLayout>
      <MainNavigation>
        <Sidebar>
          <SidebarSection>
            <SidebarMenu>
              <SidebarMenuLink href="/">
                <SidebarMenuItemIcon>
                  <ArrowLeftIcon />
                </SidebarMenuItemIcon>
                <Trans t-={t} i18nKey="back" defaults="Back" />
              </SidebarMenuLink>
            </SidebarMenu>
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
                <Trans t={t} i18nKey="profile" defaults="Profile" />
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
      </MainNavigation>
      <MainContent>{children}</MainContent>
    </MainLayout>
  );
}
