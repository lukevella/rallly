"use client";

import { SidebarMenuButton, SidebarMenuItem } from "@rallly/ui/sidebar";
import { GaugeIcon } from "lucide-react";
import { HoverPrefetchLink } from "@/components/hover-prefetch-link";
import { useUser } from "@/features/user/client";
import { Trans } from "@/i18n/client";

// `children` is the slot for the update indicator: it renders as a sibling
// of the button so SidebarMenuBadge's peer styles apply.
export function ControlPanelMenuItem({
  children,
}: {
  children?: React.ReactNode;
}) {
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
      {children}
    </SidebarMenuItem>
  );
}
