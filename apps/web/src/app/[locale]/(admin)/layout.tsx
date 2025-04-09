import { ActionBar } from "@rallly/ui/action-bar";
import { SidebarInset, SidebarTrigger } from "@rallly/ui/sidebar";

import { AppSidebar } from "@/app/[locale]/(admin)/components/sidebar/app-sidebar";
import { AppSidebarProvider } from "@/app/[locale]/(admin)/components/sidebar/app-sidebar-provider";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { RouterLoadingIndicator } from "@/components/router-loading-indicator";
import { getUser } from "@/data/get-user";
import { CommandMenu } from "@/features/command-menu";

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
      <RouterLoadingIndicator />
      <AppSidebar />
      <SidebarInset>
        <TopBar className="sm:hidden">
          <TopBarLeft>
            <SidebarTrigger />
          </TopBarLeft>
          <TopBarRight>
            <OptimizedAvatarImage src={user.image} name={user.name} size="xs" />
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
