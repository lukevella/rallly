import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
} from "@rallly/ui/sidebar";
import { ChevronsUpDownIcon } from "lucide-react";
import type React from "react";
import { UpgradeToProAlert } from "@/app/[locale]/(space)/(dashboard)/components/sidebar/upgrade-to-pro-alert";
import { requireSpace, requireUser } from "@/auth/data";
import { SpaceDropdown } from "@/features/space/components/space-dropdown";
import { SpaceIcon } from "@/features/space/components/space-icon";
import { SpaceTierLabel } from "@/features/space/components/space-tier";
import { loadSpaces } from "@/features/space/data";
import { NavUser } from "./nav-user";
import { SpaceSidebarMenu } from "./space-sidebar-menu";

async function loadData() {
  const [user, activeSpace, spaces] = await Promise.all([
    requireUser(),
    requireSpace(),
    loadSpaces(),
  ]);

  return {
    user,
    spaces,
    activeSpace,
  };
}

export async function SpaceSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { user, spaces, activeSpace } = await loadData();

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SpaceDropdown spaces={spaces} activeSpaceId={activeSpace.id}>
          <Button className="flex h-auto w-full p-2" variant="ghost">
            <SpaceIcon src={activeSpace.image} name={activeSpace.name} />
            <div className="min-w-0 flex-1 px-0.5 text-left">
              <div className="truncate font-medium text-sm">
                {activeSpace.name}
              </div>
              <div className="text-muted-foreground text-xs">
                <SpaceTierLabel tier={activeSpace.tier} />
              </div>
            </div>
            <Icon>
              <ChevronsUpDownIcon />
            </Icon>
          </Button>
        </SpaceDropdown>
      </SidebarHeader>
      <SidebarContent>
        <SpaceSidebarMenu />
      </SidebarContent>
      <SidebarFooter>
        {activeSpace.tier !== "pro" ? (
          <>
            <UpgradeToProAlert />
            <SidebarSeparator className="my-1" />
          </>
        ) : null}
        <NavUser name={user.name} image={user.image} email={user.email} />
      </SidebarFooter>
    </Sidebar>
  );
}
