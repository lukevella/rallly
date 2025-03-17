import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@rallly/ui/sidebar";
import {
  ClockIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  SidebarIcon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Clock } from "@/components/clock";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { IfFreeUser } from "@/contexts/plan";
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
          <div className="flex items-center gap-4 border-b p-3">
            <div className="flex-1">
              <div className="flex items-center gap-x-2">
                <SidebarTrigger />
              </div>
            </div>

            <div className="flex flex-1 items-center justify-end gap-x-4">
              <IfFreeUser>
                <Button size="sm" variant="primary">
                  <Icon>
                    <SparklesIcon />
                  </Icon>
                  Upgrade
                </Button>
              </IfFreeUser>
              <div className="flex items-center gap-x-2">
                <Button asChild size="icon" variant="ghost">
                  <Link href="/new">
                    <Icon>
                      <PlusIcon />
                    </Icon>
                  </Link>
                </Button>
                <Button size="icon" variant="ghost">
                  <Icon>
                    <SearchIcon />
                  </Icon>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/settings/preferences">
                    <Icon>
                      <SettingsIcon />
                    </Icon>
                  </Link>
                </Button>
                <Button variant="ghost">
                  <Clock />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-4 p-6">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
