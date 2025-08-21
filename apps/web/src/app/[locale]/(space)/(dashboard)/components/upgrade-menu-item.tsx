"use client";

import { usePostHog } from "@rallly/posthog/client";
import { SidebarMenuButton, SidebarMenuItem } from "@rallly/ui/sidebar";
import { SparklesIcon } from "lucide-react";
import { Trans } from "@/components/trans";
import { useBilling } from "@/features/billing/client";

export function UpgradeMenuItem() {
  const { showPayWall } = useBilling();
  const posthog = usePostHog();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        variant="primary"
        onClick={() => {
          posthog?.capture("space_sidebar:upgrade_button_click");
          showPayWall();
        }}
      >
        <SparklesIcon className="size-4" />
        <Trans i18nKey="upgradeToPro" defaults="Upgrade to Pro" />
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
