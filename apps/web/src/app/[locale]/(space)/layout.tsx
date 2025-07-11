import { Button } from "@rallly/ui/button";
import { SidebarInset, SidebarTrigger } from "@rallly/ui/sidebar";
import Link from "next/link";

import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { CommandMenu } from "@/features/navigation/command-menu";
import { getOnboardedUser } from "@/features/setup/queries";
import { TimezoneProvider } from "@/features/timezone/client/context";

import { LicenseLimitWarning } from "@/features/licensing/components/license-limit-warning";
import { AppSidebar } from "./components/sidebar/app-sidebar";
import { AppSidebarProvider } from "./components/sidebar/app-sidebar-provider";
import { TopBar, TopBarLeft, TopBarRight } from "./components/top-bar";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOnboardedUser();

  return (
    <TimezoneProvider initialTimezone={user.timeZone}>
      <AppSidebarProvider>
        <CommandMenu />
        <AppSidebar />
        <SidebarInset className="min-w-0">
          <TopBar className="md:hidden">
            <TopBarLeft>
              <SidebarTrigger />
            </TopBarLeft>
            <TopBarRight>
              <Button
                asChild
                variant="ghost"
                className="rounded-full"
                size="icon"
              >
                <Link href="/account/profile">
                  <OptimizedAvatarImage
                    src={user.image}
                    name={user.name}
                    size="sm"
                  />
                </Link>
              </Button>
            </TopBarRight>
          </TopBar>
          <LicenseLimitWarning />
          <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col">{children}</div>
          </div>
        </SidebarInset>
      </AppSidebarProvider>
    </TimezoneProvider>
  );
}
