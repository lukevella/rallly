import { Icon } from "@rallly/ui/icon";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@rallly/ui/sidebar";
import {
  ArrowLeftIcon,
  CreditCardIcon,
  Settings2Icon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { requireUser } from "@/auth/data";
import { Trans } from "@/components/trans";

export default async function ProfileLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <SidebarProvider>
      <Sidebar variant="inset">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/">
                      <Icon>
                        <ArrowLeftIcon />
                      </Icon>
                      <Trans i18nKey="back" defaults="Back" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>
              <Trans i18nKey="settings" defaults="Settings" />
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/account/profile">
                      <Icon>
                        <UserIcon />
                      </Icon>
                      <Trans i18nKey="profile" defaults="Profile" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/account/preferences">
                      <Icon>
                        <Settings2Icon />
                      </Icon>
                      <Trans i18nKey="preferences" defaults="Preferences" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/account/billing">
                      <Icon>
                        <CreditCardIcon />
                      </Icon>
                      <Trans i18nKey="billing" defaults="Billing" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
