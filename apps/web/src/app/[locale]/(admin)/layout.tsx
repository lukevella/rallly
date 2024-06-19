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
    <div className="flex flex-col pb-16 md:pb-0">
      <div
        className={cn(
          "fixed inset-y-0 z-50 hidden w-72 shrink-0 flex-col gap-y-4 overflow-y-auto p-6 py-5 md:flex",
        )}
      >
        <div>
          <LogoLink />
        </div>
        <Sidebar />
      </div>
      <div className={cn("grow space-y-4 p-3 md:ml-72 md:p-4 lg:px-8 lg:pb-8")}>
        {children}
      </div>
      <div className="fixed bottom-0 z-20 flex h-16 w-full flex-col justify-center bg-gray-100/90 backdrop-blur-md md:hidden">
        <MobileNavigation />
      </div>
    </div>
  );
}
