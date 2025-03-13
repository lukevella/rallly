"use client";

import { NavUser } from "@/components/sidebar/nav-user";
import { Icon } from "@rallly/ui/icon";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@rallly/ui/sidebar";
import {
  AudioWaveform,
  BarChart2Icon,
  CalendarIcon,
  Command,
  GalleryVerticalEnd,
  HomeIcon,
  PuzzleIcon,
  Settings2,
  Users2Icon,
} from "lucide-react";
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
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link
          className="inline-block p-1 transition-transform active:translate-y-1"
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
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
