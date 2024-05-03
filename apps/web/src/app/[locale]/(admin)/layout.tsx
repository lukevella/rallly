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
    <div className="bg-gray-100">
      <MobileNavigation />
      <div
        className={cn(
          "inset-y-0 z-50 hidden shrink-0 flex-col gap-y-5 overflow-y-auto px-5 py-4 lg:fixed lg:flex lg:w-72 lg:px-6 lg:py-4",
        )}
      >
        <div>
          <LogoLink />
        </div>
        <Sidebar />
      </div>
      <div className={cn("min-h-screen grow space-y-4 lg:ml-72")}>
        {children}
      </div>
    </div>
  );
}
