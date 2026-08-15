"use client";

import { Button } from "@rallly/ui/button";
import { showPayWall } from "@/features/billing/client";
import { Trans } from "@/i18n/client";

export function UpgradeToProButton({
  action,
  variant,
}: {
  action: "invite" | "reactivate";
  variant?: "link";
}) {
  return (
    <Button
      size="sm"
      variant={variant}
      onClick={() => {
        showPayWall({ from: "space-members", action });
      }}
    >
      <Trans i18nKey="upgradeToPro" defaults="Upgrade to Pro" />
    </Button>
  );
}
