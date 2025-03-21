"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarRail,
} from "@rallly/ui/sidebar";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { NavMain } from "./nav-main";

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string;
    email: string;
    image?: string;
  };
}) {
  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="p-2">
          <Link
            className="inline-block transition-transform active:translate-y-1"
            href="/"
          >
            <Image
              src="/images/logo-mark.svg"
              alt="Rallly"
              width={32}
              height={32}
              priority={true}
              className="shrink-0"
            />
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <NavMain />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
