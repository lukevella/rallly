import React from "react";

import { MainSidebar } from "@/app/[locale]/(admin)/main-navigation";
import {
  MainContent,
  MainLayout,
  MainNavigation,
} from "@/app/[locale]/(admin)/sidebar-layout";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MainLayout>
      <MainNavigation>
        <MainSidebar />
      </MainNavigation>
      <MainContent>
        <div>{children}</div>
      </MainContent>
    </MainLayout>
  );
}
