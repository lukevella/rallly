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
import { Settings2Icon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { FeedbackMenuItem } from "@/app/[locale]/(space)/(dashboard)/components/feedback-menu-item";
import { NavUser } from "@/app/[locale]/(space)/(dashboard)/components/nav-user";
import { SpaceSidebarMenu } from "@/app/[locale]/(space)/(dashboard)/components/space-sidebar-menu";
import { UpgradeMenuItem } from "@/app/[locale]/(space)/(dashboard)/components/upgrade-menu-item";
import { requireSpace, requireUser } from "@/auth/data";
import { Trans } from "@/components/trans";
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
      <Sidebar>
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
