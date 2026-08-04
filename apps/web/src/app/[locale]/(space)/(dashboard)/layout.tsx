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
import Link from "next/link";
import { CustomBrandingPrompt } from "@/features/branding/components/custom-branding-prompt";
import { LicenseLimitWarning } from "@/features/licensing/components/license-limit-warning";
import { CommandMenu } from "@/features/navigation/components/command-menu";
import { SpaceDropdown } from "@/features/space/components/space-dropdown";
import { listSpacesForUser } from "@/features/space/data";
import { NavUser } from "@/features/user/components/nav-user";
import { requireUser } from "@/features/user/loaders";
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
  const user = await requireUser();
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
                <ControlPanelMenuItem />
                <SidebarMenuItem>
                  <SidebarMenuButton render={<Link href="/settings/profile" />}>
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
      <SidebarInset id="main-content" tabIndex={-1} className="min-w-0">
        <LicenseLimitWarning />
        <CustomBrandingPrompt />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col">{children}</div>
        </div>
      </SidebarInset>
    </SpaceSidebarProvider>
  );
}
