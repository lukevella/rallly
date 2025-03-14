import { SidebarInset, SidebarProvider } from "@rallly/ui/sidebar";
import { notFound } from "next/navigation";

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
        <div className="flex flex-1 flex-col gap-4 p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
