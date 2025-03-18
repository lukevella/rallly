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
          <div className="sticky top-0 z-10 flex items-center gap-4 border-b p-3">
            <div className="flex-1">
              <div className="flex items-center gap-x-2">
                <SidebarTrigger />
              </div>
            </div>
            <div className="flex flex-1 items-center justify-end gap-x-4">
              <div className="flex items-center gap-x-2">
                <Button asChild size="icon" variant="ghost">
                  <Link href="/new">
                    <Icon>
                      <PlusIcon />
                    </Icon>
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/settings/preferences">
                    <Icon>
                      <SettingsIcon />
                    </Icon>
                  </Link>
                </Button>
                <Button size="sm" variant="ghost">
                  <Clock />
                </Button>
                <ProBadge />
                <IfFreeUser>
                  <Button size="sm" variant="primary">
                    <Icon>
                      <SparklesIcon />
                    </Icon>
                    Upgrade
                  </Button>
                </IfFreeUser>
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-4 p-6">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
