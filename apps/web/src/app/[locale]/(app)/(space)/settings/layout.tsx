import { buttonVariants } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ArrowLeftIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { NavUser } from "@/components/nav-user";
import { BillingProvider } from "@/features/billing/client";
import { Trans } from "@/i18n/client";
import { createPrivateSSRHelper } from "@/trpc/server/create-ssr-helper";
import {
  AccountSidebarMenu,
  DeveloperSidebarMenu,
  SpaceSidebarMenu,
} from "./components/sidebar";

export default async function Layout({
  children,
}: {
  children?: React.ReactNode;
}) {
  const helpers = await createPrivateSSRHelper();
  await helpers.user.getAuthed.prefetch();

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <BillingProvider>
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem className="flex items-center gap-3">
                      <Link
                        href="/"
                        className={buttonVariants({
                          variant: "ghost",
                          size: "icon",
                        })}
                      >
                        <Icon>
                          <ArrowLeftIcon />
                        </Icon>
                      </Link>
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
              <DeveloperSidebarMenu />
            </SidebarContent>
            <SidebarFooter>
              <NavUser />
            </SidebarFooter>
          </Sidebar>
          <SidebarInset>
            <div className="flex flex-1 flex-col">
              <header className="sticky top-0 z-10 border-b bg-background/90 p-3 backdrop-blur-xs md:hidden">
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
    </HydrationBoundary>
  );
}
