"use client";

import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import { Button } from "@rallly/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { useMutation } from "@tanstack/react-query";
import { RefreshCwIcon } from "lucide-react";
import { Trans } from "@/i18n/client";
import { refreshInstanceLicenseAction } from "../actions";

export function RefreshLicenseButton() {
  const refreshInstanceLicense = useMutation(
    mutationOptions(refreshInstanceLicenseAction),
  );

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            loading={refreshInstanceLicense.isPending}
            onClick={() => refreshInstanceLicense.mutate()}
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
