import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@rallly/ui/sidebar";
import { PlusIcon, SettingsIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";

import { Clock } from "@/components/clock";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { IfFreeUser, IfSubscribed } from "@/contexts/plan";
import { requireUser } from "@/next-auth";

import { ProBadge } from "./pro-badge";
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
          <div className="flex flex-1 flex-col p-6">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
