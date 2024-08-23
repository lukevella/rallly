import { cn } from "@rallly/ui";
import React from "react";

import { MobileNavigation } from "@/app/[locale]/(admin)/mobile-navigation";
import { ProBadge } from "@/app/[locale]/(admin)/pro-badge";
import { Sidebar } from "@/app/[locale]/(admin)/sidebar";
import { LogoLink } from "@/app/components/logo-link";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col pb-16 md:pb-0">
      <div
        className={cn(
          "fixed inset-y-0 z-50 hidden w-72 shrink-0 flex-col gap-y-4 overflow-y-auto p-6 py-5 md:flex",
        )}
      >
        <div className="flex w-full items-center justify-between gap-4">
          <LogoLink />
          <ProBadge />
        </div>
        <Sidebar />
      </div>
      <div
        className={cn(
          "flex flex-1 flex-col pb-2 lg:min-w-0 lg:pl-72 lg:pr-2 lg:pt-2",
        )}
      >
        <div className="grow p-6 lg:rounded-lg lg:bg-white lg:p-10 lg:shadow-sm lg:ring-1 lg:ring-gray-950/5 dark:lg:bg-gray-900 dark:lg:ring-white/10">
          {children}
        </div>
      </div>
      <div className="fixed bottom-0 z-20 flex h-16 w-full flex-col justify-center bg-gray-100/90 backdrop-blur-md md:hidden">
        <MobileNavigation />
      </div>
    </div>
  );
}
