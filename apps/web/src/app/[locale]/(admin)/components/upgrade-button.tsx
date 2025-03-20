"use client";
import { Button } from "@rallly/ui/button";
import { DialogTrigger } from "@rallly/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@rallly/ui/tooltip";
import { SparklesIcon } from "lucide-react";
import Link from "next/link";
import { Trans } from "react-i18next";

import { PayWallDialog } from "@/components/pay-wall-dialog";

export function UpgradeButton() {
  return (
    <PayWallDialog>
      <DialogTrigger>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="text-primary hover:bg-primary-50"
                asChild
              >
                <Link href="/upgrade">
                  <SparklesIcon className="size-4" />
                  <Trans i18nKey="upgrade" defaults="Upgrade" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <Trans i18nKey="upgradeToPro" defaults="Upgrade to Pro" />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </DialogTrigger>
    </PayWallDialog>
  );
}
