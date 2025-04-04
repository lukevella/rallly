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

import { AppSidebar } from "@/app/[locale]/(admin)/components/sidebar/app-sidebar";
import { AppSidebarProvider } from "@/app/[locale]/(admin)/components/sidebar/app-sidebar-provider";
import { Trans } from "@/components/trans";
import { getUser } from "@/data/get-user";

import { UpgradeButton } from "./components/upgrade-button";
import { UserDropdown } from "./components/user-dropdown";
import { ProBadge } from "@/components/pro-badge";
import {
  TopBar,
  TopBarGroup,
  TopBarLeft,
  TopBarRight,
  TopBarSeparator,
} from "./components/top-bar";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <AppSidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <TopBar>
            <TopBarLeft>
              <TopBarGroup className="md:hidden">
                <SidebarTrigger />
              </TopBarGroup>
            </TopBarLeft>
            <TopBarRight>
              <TopBarGroup>
                {user.subscription?.active ? <ProBadge /> : <UpgradeButton />}
                <TopBarSeparator />
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
                <UserDropdown
                  name={user.name ?? ""}
                  image={user.image ?? undefined}
                  email={user.email ?? ""}
                />
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
