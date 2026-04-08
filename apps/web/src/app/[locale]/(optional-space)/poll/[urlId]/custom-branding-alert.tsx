"use client";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@rallly/ui/alert";
import { Button } from "@rallly/ui/button";
import { PaletteIcon } from "lucide-react";
import { usePoll } from "@/contexts/poll";
import { useBilling } from "@/features/billing/client";
import { Trans } from "@/i18n/client";

export function CustomBrandingAlert() {
  const poll = usePoll();
  const { isFree, showPayWall } = useBilling();

  if (!isFree || !poll.space || poll.space.showBranding) {
    return null;
  }

  return (
    <Alert variant="primary">
      <PaletteIcon />
      <AlertTitle>
        <Trans
          i18nKey="customBrandingAlertTitle"
          defaults="Show your brand to participants"
        />
      </AlertTitle>
      <AlertDescription>
        <p className="text-sm">
          <Trans
            i18nKey="pollAdminCustomBrandingAlertDescription"
            defaults="Upgrade to Pro to show your logo and brand colors to participants."
          />
        </p>
      </AlertDescription>
      <AlertAction>
        <Button size="sm" variant="default" onClick={showPayWall}>
          <Trans i18nKey="upgrade" defaults="Upgrade" />
        </Button>
      </AlertAction>
    </Alert>
  );
}
