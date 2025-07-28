import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
} from "@rallly/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { ChevronsUpDownIcon, PlusIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { LogoLink } from "@/app/components/logo-link";
import { requireSpace, requireUser } from "@/auth/data";
import { Trans } from "@/components/trans";
import { FeedbackToggle } from "@/features/feedback/components/feedback-toggle";
import { SpaceDropdown } from "@/features/space/components/space-dropdown";
import { SpaceIcon } from "@/features/space/components/space-icon";
import { isSpacesEnabled } from "@/features/space/constants";
import { loadSpaces } from "@/features/space/data";
import { UpgradeButton } from "../upgrade-button";
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
        {isSpacesEnabled ? (
          <SpaceDropdown spaces={spaces} activeSpaceId={activeSpace.id}>
            <button
              type="button"
              className="flex h-auto w-full items-center gap-2 rounded-lg border bg-background/25 p-2 hover:bg-background/50"
            >
              <SpaceIcon name={activeSpace.name} />
              <div className="flex-1 px-0.5 text-left">
                <div className="font-medium text-sm">{activeSpace.name}</div>
                <div className="text-muted-foreground text-xs">
                  {activeSpace.tier === "pro" ? (
                    <Trans i18nKey="planPro" defaults="Pro" />
                  ) : (
                    <Trans i18nKey="planFree" defaults="Free" />
                  )}
                </div>
              </div>
              <Icon>
                <ChevronsUpDownIcon />
              </Icon>
            </button>
          </SpaceDropdown>
        ) : (
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
        )}
      </SidebarHeader>
      <SidebarContent>
        <SpaceSidebarMenu />
      </SidebarContent>
      <SidebarFooter>
        {activeSpace.tier !== "pro" ? (
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
            <SidebarSeparator className="my-1" />
          </>
        ) : null}
        <NavUser
          name={user.name}
          image={user.image}
          plan={
            activeSpace.tier === "pro" ? (
              <Trans i18nKey="planPro" defaults="Pro" />
            ) : (
              <Trans i18nKey="planFree" defaults="Free" />
            )
          }
        />
      </SidebarFooter>
    </Sidebar>
  );
}
