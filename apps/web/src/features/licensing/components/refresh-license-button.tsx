"use client";

import { Button } from "@rallly/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { RefreshCwIcon } from "lucide-react";
import { Trans } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { refreshInstanceLicenseAction } from "../actions";

export function RefreshLicenseButton() {
  const refreshInstanceLicense = useSafeAction(refreshInstanceLicenseAction);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            loading={refreshInstanceLicense.isExecuting}
            onClick={async () => await refreshInstanceLicense.executeAsync()}
          >
            <RefreshCwIcon className="text-muted-foreground" />
            <span className="sr-only">
              <Trans i18nKey="refreshLicense" defaults="Refresh license" />
            </span>
          </Button>
        }
      />
      <TooltipContent>
        <Trans i18nKey="refreshLicense" defaults="Refresh license" />
      </TooltipContent>
    </Tooltip>
  );
}
