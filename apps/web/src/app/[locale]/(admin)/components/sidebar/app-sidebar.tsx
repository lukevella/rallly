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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
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
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <NavMain />
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
