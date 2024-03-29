import React from "react";

import { MainSidebar } from "@/app/[locale]/(admin)/main-navigation";
import {
  SidebarContent,
  SidebarLayout,
  SidebarNavigation,
} from "@/app/[locale]/(admin)/sidebar-layout";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarLayout>
      <SidebarNavigation>
        <MainSidebar />
      </SidebarNavigation>
      <SidebarContent>
        <div>{children}</div>
      </SidebarContent>
    </SidebarLayout>
  );
}
