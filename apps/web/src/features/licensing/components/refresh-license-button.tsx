"use client";

import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { RefreshCwIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Trans } from "@/i18n/client";
import { trpc } from "@/trpc/client";

export function RefreshLicenseButton() {
  const router = useRouter();
  const refreshInstanceLicense = trpc.licensing.refresh.useMutation({
    onSuccess: () => {
      router.refresh();
    },
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          loading={refreshInstanceLicense.isPending}
          onClick={async () => await refreshInstanceLicense.mutateAsync()}
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
