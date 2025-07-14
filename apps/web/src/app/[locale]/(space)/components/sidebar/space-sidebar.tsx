import { SpaceSidebarMenu } from "@/app/[locale]/(space)/components/sidebar/space-sidebar-menu";
import { LogoLink } from "@/app/components/logo-link";
import { getActiveSpace, requireUserAbility } from "@/auth/queries";
import { Trans } from "@/components/trans";
import { FeedbackToggle } from "@/features/feedback/components/feedback-toggle";
import { SpaceDropdown } from "@/features/spaces/components/space-dropdown";
import { SpaceIcon } from "@/features/spaces/components/space-icon";
import { isSpacesEnabled } from "@/features/spaces/constants";
import { loadSpaces } from "@/features/spaces/queries";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarSeparator,
} from "@rallly/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { ChevronsUpDownIcon, PlusIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { UpgradeButton } from "../upgrade-button";
import { NavUser } from "./nav-user";

async function loadData() {
  const [{ user }, spaces, activeSpace] = await Promise.all([
    requireUserAbility(),
    loadSpaces(),
    getActiveSpace(),
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
        <div className="flex items-center justify-between p-1">
          <div className="flex items-center gap-2">
            <LogoLink />
          </div>
          <div className="flex items-center gap-1">
            <FeedbackToggle />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/new">
                    <Icon>
                      <PlusIcon />
                    </Icon>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <Trans i18nKey="create" />
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        {isSpacesEnabled ? (
          <div>
            <SpaceDropdown spaces={spaces} activeSpaceId={activeSpace.id}>
              <Button className="h-auto w-full rounded-lg p-1" variant="ghost">
                <SpaceIcon name={activeSpace.name} />
                <div className="flex-1 px-0.5 text-left">
                  <div>{activeSpace.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {activeSpace.isPro ? "Pro" : "Free"}
                  </div>
                </div>
                <Icon>
                  <ChevronsUpDownIcon />
                </Icon>
              </Button>
            </SpaceDropdown>
          </div>
        ) : null}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SpaceSidebarMenu />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {!user.isPro ? (
          <>
            <div className="relative overflow-hidden rounded-xl border bg-gray-50 p-3 text-sm shadow-sm">
              <SparklesIcon className="-top-4 absolute right-0 z-0 size-16 text-gray-200" />
              <div className="relative z-10">
                <h2 className="font-semibold">
                  <Trans i18nKey="upgrade" defaults="Upgrade" />
                </h2>
                <p className="mt-1 mb-3 text-muted-foreground text-sm">
                  <Trans
                    i18nKey="upgradeToProDesc"
                    defaults="Unlock all Pro features"
                  />
                </p>
                <UpgradeButton>
                  <Button variant="primary" className="w-full">
                    <Trans i18nKey="upgrade" defaults="Upgrade" />
                  </Button>
                </UpgradeButton>
              </div>
            </div>
            <SidebarSeparator />
          </>
        ) : null}
        <NavUser
          name={user.name}
          image={user.image}
          plan={
            <span className="capitalize">{activeSpace.role.toLowerCase()}</span>
          }
        />
      </SidebarFooter>
    </Sidebar>
  );
}
