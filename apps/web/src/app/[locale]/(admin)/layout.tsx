import { SidebarInset, SidebarProvider } from "@rallly/ui/sidebar";
import { notFound } from "next/navigation";

import { Clock } from "@/components/clock";
import { LocalTime } from "@/components/local-time";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { auth } from "@/next-auth";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || !session.user.name || !session.user.email) {
    notFound();
  }

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image ?? undefined,
        }}
      />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b p-4">
            <div className=""></div>
            <div className="text-sm text-gray-600">
              <Clock />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-4 p-6">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
