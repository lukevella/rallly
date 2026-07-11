"use client";

import { posthog } from "@rallly/posthog/client";
import { SidebarMenuButton, SidebarMenuItem } from "@rallly/ui/sidebar";
import { SparklesIcon } from "lucide-react";
import { showPayWall, useIsFree } from "@/features/billing/client";
import { Trans } from "@/i18n/client";

export function UpgradeMenuItem() {
  const isFree = useIsFree();

  if (!isFree) {
    return null;
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        variant="primary"
        onClick={() => {
          posthog?.capture("space_sidebar:upgrade_button_click");
          showPayWall();
        }}
      >
        <SparklesIcon />
        <Trans i18nKey="upgradeToPro" defaults="Upgrade to Pro" />
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
