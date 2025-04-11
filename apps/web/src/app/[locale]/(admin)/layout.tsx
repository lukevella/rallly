import { ActionBar } from "@rallly/ui/action-bar";
import { Button } from "@rallly/ui/button";
import { SidebarInset, SidebarTrigger } from "@rallly/ui/sidebar";
import Link from "next/link";

import { AppSidebar } from "@/app/[locale]/(admin)/components/sidebar/app-sidebar";
import { AppSidebarProvider } from "@/app/[locale]/(admin)/components/sidebar/app-sidebar-provider";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { getUser } from "@/data/get-user";
import { CommandMenu } from "@/features/navigation/command-menu";

import { TopBar, TopBarLeft, TopBarRight } from "./components/top-bar";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  return (
    <AppSidebarProvider>
      <CommandMenu />
      <AppSidebar />
      <SidebarInset>
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
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col p-4 md:p-8">{children}</div>
        </div>
        <ActionBar />
      </SidebarInset>
    </AppSidebarProvider>
  );
}
