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
import { SettingsIcon } from "lucide-react";
import { Suspense } from "react";
import { HoverPrefetchLink } from "@/components/hover-prefetch-link";
import { PastDueAlert } from "@/features/billing/components/past-due-alert";
import { UpdateIndicator } from "@/features/instance-settings/components/update-indicator";
import { LicenseLimitWarning } from "@/features/licensing/components/license-limit-warning";
import { CommandMenu } from "@/features/navigation/components/command-menu";
import { SpaceDropdown } from "@/features/space/components/space-dropdown";
import { listSpacesForUser } from "@/features/space/data";
import { NavUser } from "@/features/user/components/nav-user";
import { loadUser } from "@/features/user/loaders";
import { Trans } from "@/i18n/client";
import { IfFeatureEnabled } from "@/lib/feature-flags/client";
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
  const user = await loadUser();
  const spaces = await listSpacesForUser(user.id);

  return (
    <SpaceSidebarProvider>
      <CommandMenu />
      <Sidebar>
        <SidebarHeader>
          <SpaceDropdown
            spaces={spaces.map((space) => ({
              id: space.id,
              name: space.name,
              image: space.image,
              tier: space.tier,
              role: space.role,
            }))}
          />
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
                <ControlPanelMenuItem>
                  {/* Admin-only and behind its own boundary: the update
                      check is a network call that must not hold the
                      sidebar back */}
                  {user.role === "admin" ? (
                    <Suspense fallback={null}>
                      <UpdateIndicator />
                    </Suspense>
                  ) : null}
                </ControlPanelMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<HoverPrefetchLink href="/settings/profile" />}
                  >
                    <SettingsIcon />
                    <Trans i18nKey="settings" defaults="Settings" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarSeparator className="my-1" />
          <NavUser />
        </SidebarFooter>
      </Sidebar>
      {/* Bounded to the viewport so a page can own its scroll area (list
          views scroll their rows under a fixed header); other pages scroll
          the wrapper below instead of the window. */}
      <SidebarInset id="main-content" tabIndex={-1} className="h-svh min-w-0">
        <LicenseLimitWarning />
        <PastDueAlert />
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </div>
      </SidebarInset>
    </SpaceSidebarProvider>
  );
}
