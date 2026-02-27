import { Icon } from "@rallly/ui/icon";
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
import { Settings2Icon } from "lucide-react";
import Link from "next/link";
import { ControlPanelMenuItem } from "@/app/[locale]/(app)/(space)/(dashboard)/components/control-panel-menu-item";
import { FeedbackMenuItem } from "@/app/[locale]/(app)/(space)/(dashboard)/components/feedback-menu-item";
import { SpaceSidebarMenu } from "@/app/[locale]/(app)/(space)/(dashboard)/components/space-sidebar-menu";
import { UpgradeMenuItem } from "@/app/[locale]/(app)/(space)/(dashboard)/components/upgrade-menu-item";
import { NavUser } from "@/components/nav-user";
import { UserLocaleSync } from "@/components/user-provider";
import { LicenseLimitWarning } from "@/features/licensing/components/license-limit-warning";
import { CommandMenu } from "@/features/navigation/command-menu";
import { SpaceDropdown } from "@/features/space/components/space-dropdown";
import { Trans } from "@/i18n/client";
import { IfFeatureEnabled } from "@/lib/feature-flags/client";
import { createPrivateSSRHelper } from "@/trpc/next/ssr";
import { SpaceSidebarProvider } from "./components/space-sidebar-provider";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const helpers = await createPrivateSSRHelper();

  await Promise.all([
    helpers.user.getAuthed.prefetch(),
    helpers.spaces.list.prefetch(),
  ]);

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <UserLocaleSync />
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
                      <Link href="/settings/preferences">
                        <Icon>
                          <Settings2Icon />
                        </Icon>
                        <Trans i18nKey="preferences" defaults="Preferences" />
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
