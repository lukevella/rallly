import { SidebarInset, SidebarProvider } from "@rallly/ui/sidebar";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { requireUser } from "@/next-auth";

import TopBar from "./top-bar";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: user.name ?? "",
          email: user.email ?? "",
          image: user.image ?? undefined,
        }}
      />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <TopBar />
          <div className="flex flex-1 flex-col p-4 md:p-8">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
