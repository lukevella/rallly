import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

import { MobileNavigation } from "@/app/[locale]/(admin)/mobile-navigation";
import { ProBadge } from "@/app/[locale]/(admin)/pro-badge";
import { Sidebar } from "@/app/[locale]/(admin)/sidebar";
import { LogoLink } from "@/app/components/logo-link";
import { UserDropdown } from "@/components/user-dropdown";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col pb-16 md:pb-0">
      <div
        className={cn(
          "fixed inset-y-0 z-50 hidden w-72 shrink-0 flex-col gap-y-8 overflow-y-auto p-6 lg:flex",
        )}
      >
        <div className="flex w-full items-center justify-between gap-4">
          <LogoLink />
          <ProBadge />
        </div>
        <Sidebar />
      </div>
      <div className={cn("pb-16 lg:min-w-0 lg:pb-0 lg:pl-72")}>
        <div className="mx-auto max-w-7xl p-6 xl:pr-12">
          <div className="mb-6 flex justify-end gap-2">
            <div className="flex items-center gap-4">
              <Button variant="primary" asChild>
                <Link href="/new">
                  <Icon>
                    <PlusIcon />
                  </Icon>
                  Create
                </Link>
              </Button>
              <UserDropdown />
            </div>
          </div>
          {children}
        </div>
      </div>
      <div className="fixed bottom-0 z-20 flex h-16 w-full flex-col justify-center bg-gray-100/90 backdrop-blur-md lg:hidden">
        <MobileNavigation />
      </div>
    </div>
  );
}
