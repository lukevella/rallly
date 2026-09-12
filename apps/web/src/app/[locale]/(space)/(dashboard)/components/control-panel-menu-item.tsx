"use client";

import { SidebarMenuButton, SidebarMenuItem } from "@rallly/ui/sidebar";
import { GaugeIcon } from "lucide-react";
import { HoverPrefetchLink } from "@/components/hover-prefetch-link";
import { useUser } from "@/features/user/client";
import { Trans } from "@/i18n/client";

export function ControlPanelMenuItem() {
  const { user } = useUser();

  if (user?.role !== "admin") {
    return null;
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton render={<HoverPrefetchLink href="/control-panel" />}>
        <GaugeIcon />
        <Trans i18nKey="controlPanel" defaults="Control Panel" />
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
