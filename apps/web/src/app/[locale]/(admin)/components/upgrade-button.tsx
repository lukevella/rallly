"use client";

import { Button } from "@rallly/ui/button";
import { DialogTrigger } from "@rallly/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { SparklesIcon } from "lucide-react";
import { Trans } from "react-i18next";

import { PayWallDialog } from "@/components/pay-wall-dialog";

export function UpgradeButton() {
  return (
    <PayWallDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="text-primary hover:bg-primary-50"
            >
              <SparklesIcon className="size-4" />
              <Trans i18nKey="upgrade" defaults="Upgrade" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <Trans i18nKey="upgradeToPro" defaults="Upgrade to Pro" />
        </TooltipContent>
      </Tooltip>
    </PayWallDialog>
  );
}
