import { buttonVariants } from "@rallly/ui";
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
import { ArrowLeftIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { NavUser } from "@/features/user/components/nav-user";
import { Trans } from "@/i18n/client";
import {
  AccountSidebarMenu,
  DeveloperSidebarMenu,
  SpaceSidebarMenu,
} from "./components/sidebar";

export default function Layout({ children }: { children?: React.ReactNode }) {
  return (
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
                    <span className="sr-only">
                      <Trans i18nKey="back" defaults="Back" />
                    </span>
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
      <SidebarInset id="main-content" tabIndex={-1}>
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
          <div className="flex-1 p-4 lg:py-12">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
