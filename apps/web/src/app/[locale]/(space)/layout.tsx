import { Button } from "@rallly/ui/button";
import { SidebarInset, SidebarTrigger } from "@rallly/ui/sidebar";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSpace, requireUser } from "@/auth/data";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { LicenseLimitWarning } from "@/features/licensing/components/license-limit-warning";
import { CommandMenu } from "@/features/navigation/command-menu";
import { isUserOnboarded } from "@/features/setup/utils";
import { SpaceProvider } from "@/features/space/client";
import { TimezoneProvider } from "@/lib/timezone/client/context";
import { SpaceSidebar } from "./components/sidebar/space-sidebar";
import { SpaceSidebarProvider } from "./components/sidebar/space-sidebar-provider";
import { TopBar, TopBarLeft, TopBarRight } from "./components/top-bar";

async function loadData() {
  const [user, space] = await Promise.all([requireUser(), requireSpace()]);

  if (!isUserOnboarded(user)) {
    redirect("/setup");
  }

  return {
    user,
    space,
  };
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, space } = await loadData();

  return (
    <SpaceProvider data={space} userId={user.id}>
      <TimezoneProvider initialTimezone={user.timeZone}>
        <SpaceSidebarProvider>
          <CommandMenu />
          <SpaceSidebar />
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
        </SpaceSidebarProvider>
      </TimezoneProvider>
    </SpaceProvider>
  );
}
