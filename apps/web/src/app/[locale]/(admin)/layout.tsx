import { cn } from "@rallly/ui";
import React from "react";

import { MobileNavigation } from "@/app/[locale]/(admin)/mobile-navigation";
import { Sidebar } from "@/app/[locale]/(admin)/sidebar";
import { LogoLink } from "@/app/components/logo-link";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col bg-gray-100 pb-16 sm:pb-0">
      <div
        className={cn(
          "fixed inset-y-0 z-50 hidden w-72 shrink-0 flex-col gap-y-5 overflow-y-auto px-6 py-5 sm:flex",
        )}
      >
        <div>
          <LogoLink />
        </div>
        <Sidebar />
      </div>
      <div className={cn("grow space-y-4 sm:ml-72")}>{children}</div>
      <div className="fixed bottom-0 z-20 flex h-16 w-full flex-col justify-center bg-gray-100/90 backdrop-blur-md sm:hidden">
        <MobileNavigation />
      </div>
    </div>
  );
}
