import { ArrowLeftIcon, CreditCardIcon, Settings2Icon } from "lucide-react";
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
import { UserMenu } from "@/app/[locale]/(admin)/user-menu";
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
    <SidebarLayout>
      <SidebarNavigation>
        <Sidebar>
          <SidebarSection>
            <SidebarMenuLink href="/">
              <SidebarMenuItemIcon>
                <ArrowLeftIcon />
              </SidebarMenuItemIcon>
              <Trans t-={t} i18nKey="back" defaults="Back" />
            </SidebarMenuLink>
          </SidebarSection>
          <SidebarSection>
            <SidebarMenu>
              <UserMenu />
            </SidebarMenu>
          </SidebarSection>
          <SidebarSection>
            <SidebarMenuLabel>
              <Trans t={t} i18nKey="settings" />
            </SidebarMenuLabel>
            <SidebarMenu>
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
