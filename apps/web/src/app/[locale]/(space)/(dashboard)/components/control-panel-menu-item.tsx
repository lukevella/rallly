"use client";

import { SidebarMenuButton, SidebarMenuItem } from "@rallly/ui/sidebar";
import { GaugeIcon } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/features/user/components/user-provider";
import { Trans } from "@/i18n/client";

export function ControlPanelMenuItem() {
  const { user } = useUser();

  if (user?.role !== "admin") {
    return null;
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton render={<Link href="/control-panel" />}>
        <GaugeIcon />
        <Trans i18nKey="controlPanel" defaults="Control Panel" />
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
