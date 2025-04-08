import { ActionBar } from "@rallly/ui/action-bar";
import { SidebarInset } from "@rallly/ui/sidebar";

import { AppSidebar } from "@/app/[locale]/(admin)/components/sidebar/app-sidebar";
import { AppSidebarProvider } from "@/app/[locale]/(admin)/components/sidebar/app-sidebar-provider";
import { RouterLoadingIndicator } from "@/components/router-loading-indicator";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppSidebarProvider>
      <RouterLoadingIndicator />
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col p-4 md:p-8">{children}</div>
        </div>
        <ActionBar />
      </SidebarInset>
    </AppSidebarProvider>
  );
}
