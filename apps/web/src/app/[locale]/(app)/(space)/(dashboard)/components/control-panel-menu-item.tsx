"use client";

import { Icon } from "@rallly/ui/icon";
import { SidebarMenuButton, SidebarMenuItem } from "@rallly/ui/sidebar";
import { GaugeIcon } from "lucide-react";
import Link from "next/link";
import { Trans } from "@/i18n/client";
import { trpc } from "@/trpc/client";

export function ControlPanelMenuItem() {
  const { data: user } = trpc.user.getAuthed.useQuery();

  if (user?.role !== "admin") {
    return null;
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link href="/control-panel">
          <Icon>
            <GaugeIcon />
          </Icon>
          <Trans i18nKey="controlPanel" defaults="Control Panel" />
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
