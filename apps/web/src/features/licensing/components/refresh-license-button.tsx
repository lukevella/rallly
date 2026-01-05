"use client";

import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { RefreshCwIcon } from "lucide-react";
import { Trans } from "@/components/trans";
import { useSafeAction } from "@/lib/safe-action/client";
import { refreshInstanceLicenseAction } from "../actions";

export function RefreshLicenseButton() {
  const refreshInstanceLicense = useSafeAction(refreshInstanceLicenseAction);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          loading={refreshInstanceLicense.isExecuting}
          onClick={async () => await refreshInstanceLicense.executeAsync()}
        >
          <Icon>
            <RefreshCwIcon />
          </Icon>
          <span className="sr-only">
            <Trans i18nKey="refreshLicense" defaults="Refresh License" />
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <Trans i18nKey="refreshLicense" defaults="Refresh License" />
      </TooltipContent>
    </Tooltip>
  );
}
