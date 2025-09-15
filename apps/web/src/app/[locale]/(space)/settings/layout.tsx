import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@rallly/ui/sidebar";
import { ArrowLeftIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { Trans } from "@/components/trans";
import { BillingProvider } from "@/features/billing/client";
import { AccountSidebarMenu, SpaceSidebarMenu } from "./components/sidebar";

export default async function ProfileLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <BillingProvider>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href="/">
                        <Icon>
                          <ArrowLeftIcon />
                        </Icon>
                      </Link>
                    </Button>
                    <span className="font-medium text-sm">
                      <Trans i18nKey="settings" defaults="Settings" />
                    </span>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarHeader>
          <SidebarSeparator />
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>
                <Trans i18nKey="account" defaults="Account" />
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <AccountSidebarMenu />
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>
                <Trans i18nKey="space" defaults="Space" />
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SpaceSidebarMenu />
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <div className="flex flex-1 flex-col">
            <header className="sticky top-0 z-10 border-b bg-background/90 p-3 backdrop-blur-sm md:hidden">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div className="flex items-center gap-2">
                  <Icon>
                    <SettingsIcon />
                  </Icon>
                  <span className="font-medium text-sm">
                    <Trans i18nKey="settings" defaults="Settings" />
                  </span>
                </div>
              </div>
            </header>
            <main className="flex-1 p-4 lg:py-12">{children}</main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </BillingProvider>
  );
}
