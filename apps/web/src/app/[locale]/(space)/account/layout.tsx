import { Icon } from "@rallly/ui/icon";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@rallly/ui/sidebar";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { AccountSidebarMenu } from "@/app/[locale]/(space)/account/components/sidebar";
import { Trans } from "@/components/trans";
import { SignOutButton } from "./components/sign-out-button";

export default async function ProfileLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
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
              <AccountSidebarMenu />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SignOutButton />
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
