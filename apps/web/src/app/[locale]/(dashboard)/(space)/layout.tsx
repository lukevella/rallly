import { Button } from "@rallly/ui/button";
import { SidebarInset, SidebarTrigger } from "@rallly/ui/sidebar";
import Link from "next/link";

import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { getOnboardedUser } from "@/features/setup/queries";
import { TimezoneProvider } from "@/features/timezone/client/context";

import { LicenseLimitWarning } from "@/features/licensing/components/license-limit-warning";
import { TopBar, TopBarLeft, TopBarRight } from "./components/top-bar";
import { AppSidebar } from "./sidebar";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOnboardedUser();

  return (
    <TimezoneProvider initialTimezone={user.timeZone}>
      <AppSidebar />
      <SidebarInset className="min-h-0 min-w-0">
        <TopBar className="sm:hidden">
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
              <Link href="/settings/profile">
                <OptimizedAvatarImage
                  src={user.image}
                  name={user.name}
                  size="xs"
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
    </TimezoneProvider>
  );
}
