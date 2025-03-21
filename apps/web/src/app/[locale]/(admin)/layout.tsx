import { ActionBar } from "@rallly/ui/action-bar";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { SidebarInset, SidebarTrigger } from "@rallly/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@rallly/ui/tooltip";
import { SettingsIcon } from "lucide-react";
import Link from "next/link";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { AppSidebarProvider } from "@/components/sidebar/app-sidebar-provider";
import { Trans } from "@/components/trans";
import { IfFreeUser } from "@/contexts/plan";
import { requireUser } from "@/next-auth";
import { getBrowserTimeZone } from "@/utils/date-time-utils";

import { UpgradeButton } from "./components/upgrade-button";
import { UserDropdown } from "./components/user-dropdown";
import { ProBadge } from "./pro-badge";
import {
  TopBar,
  TopBarGroup,
  TopBarLeft,
  TopBarRight,
  TopBarSeparator,
} from "./top-bar";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <AppSidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <TopBar>
            <TopBarLeft>
              <TopBarGroup>
                <SidebarTrigger />
                <TopBarSeparator />
              </TopBarGroup>
            </TopBarLeft>
            <TopBarRight>
              <TopBarGroup>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href="/settings/preferences">
                          <Icon>
                            <SettingsIcon />
                          </Icon>
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <Trans i18nKey="settings" defaults="Settings" />
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button size="sm" variant="ghost" asChild>
                  <Link href="/settings/preferences">
                    {user.timeZone ?? getBrowserTimeZone()}
                  </Link>
                </Button>
                <UserDropdown
                  name={user.name ?? ""}
                  image={user.image ?? undefined}
                  email={user.email ?? ""}
                />
                <TopBarSeparator />
                <ProBadge />
                <IfFreeUser>
                  <UpgradeButton />
                </IfFreeUser>
              </TopBarGroup>
            </TopBarRight>
          </TopBar>
          <div className="flex flex-1 flex-col p-4 md:p-8">{children}</div>
        </div>
        <ActionBar />
      </SidebarInset>
    </AppSidebarProvider>
  );
}
