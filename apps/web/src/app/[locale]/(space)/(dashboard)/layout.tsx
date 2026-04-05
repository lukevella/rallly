import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@rallly/ui/sidebar";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { SettingsIcon } from "lucide-react";
import Link from "next/link";
import { NavUser } from "@/components/nav-user";
import { LicenseLimitWarning } from "@/features/licensing/components/license-limit-warning";
import { CommandMenu } from "@/features/navigation/command-menu";
import { SpaceDropdown } from "@/features/space/components/space-dropdown";
import { Trans } from "@/i18n/client";
import { IfFeatureEnabled } from "@/lib/feature-flags/client";
import { createPrivateSSRHelper } from "@/trpc/server/create-ssr-helper";
import { ControlPanelMenuItem } from "./components/control-panel-menu-item";
import { FeedbackMenuItem } from "./components/feedback-menu-item";
import { SpaceSidebarMenu } from "./components/space-sidebar-menu";
import { SpaceSidebarProvider } from "./components/space-sidebar-provider";
import { UpgradeMenuItem } from "./components/upgrade-menu-item";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const helpers = await createPrivateSSRHelper();

  await Promise.all([
    helpers.billing.getTier.prefetch(),
    helpers.user.getAuthed.prefetch(),
    helpers.spaces.list.prefetch(),
  ]);

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <SpaceSidebarProvider>
        <CommandMenu />
        <Sidebar>
          <SidebarHeader>
            <SpaceDropdown />
          </SidebarHeader>
          <SidebarContent>
            <SpaceSidebarMenu />
          </SidebarContent>
          <SidebarFooter>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <UpgradeMenuItem />
                  <IfFeatureEnabled feature="feedback">
                    <FeedbackMenuItem />
                  </IfFeatureEnabled>
                  <ControlPanelMenuItem />
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/settings/profile">
                        <SettingsIcon />
                        <Trans i18nKey="settings" defaults="Settings" />
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator className="my-1" />
            <NavUser />
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="min-w-0">
          <LicenseLimitWarning />
          <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col">{children}</div>
          </div>
        </SidebarInset>
      </SpaceSidebarProvider>
    </HydrationBoundary>
  );
}
