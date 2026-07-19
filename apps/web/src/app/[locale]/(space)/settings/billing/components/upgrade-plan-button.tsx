"use client";

import { posthog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import { showPayWall } from "@/features/billing/client";
import { Trans } from "@/i18n/client";

export function UpgradePlanButton() {
  return (
    <Button
      variant="primary"
      onClick={() => {
        showPayWall();
        posthog?.capture("space_billing:upgrade_button_click");
      }}
    >
      <Trans i18nKey="upgradeToPro" />
    </Button>
  );
}
