import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarSeparator,
} from "@rallly/ui/sidebar";
import type { Metadata } from "next";
import { FeedbackMenuItem } from "@/app/[locale]/(space)/(dashboard)/components/feedback-menu-item";
import { NavUser } from "@/app/[locale]/(space)/(dashboard)/components/nav-user";
import { SpaceSidebarMenu } from "@/app/[locale]/(space)/(dashboard)/components/space-sidebar-menu";
import { UpgradeMenuItem } from "@/app/[locale]/(space)/(dashboard)/components/upgrade-menu-item";
import { requireSpace, requireUser } from "@/auth/data";
import { LicenseLimitWarning } from "@/features/licensing/components/license-limit-warning";
import { CommandMenu } from "@/features/navigation/command-menu";
import { SpaceDropdown } from "@/features/space/components/space-dropdown";
import { loadSpaces } from "@/features/space/data";
import { IfFeatureEnabled } from "@/lib/feature-flags/client";
import { SpaceSidebarProvider } from "./components/space-sidebar-provider";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, activeSpace, spaces] = await Promise.all([
    requireUser(),
    requireSpace(),
    loadSpaces(),
  ]);

  return (
    <SpaceSidebarProvider>
      <CommandMenu />
      <Sidebar variant="inset">
        <SidebarHeader>
          <SpaceDropdown spaces={spaces} initialSpaceId={activeSpace.id} />
        </SidebarHeader>
        <SidebarContent>
          <SpaceSidebarMenu />
        </SidebarContent>
        <SidebarFooter>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {activeSpace.tier === "hobby" ? <UpgradeMenuItem /> : null}
                <IfFeatureEnabled feature="feedback">
                  <FeedbackMenuItem />
                </IfFeatureEnabled>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarSeparator className="my-1" />
          <NavUser name={user.name} image={user.image} email={user.email} />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0">
        <LicenseLimitWarning />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col">{children}</div>
        </div>
      </SidebarInset>
    </SpaceSidebarProvider>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const space = await requireSpace();
  return {
    title: {
      template: `%s | ${space.name} | Rallly`,
      default: space.name,
    },
  };
}
