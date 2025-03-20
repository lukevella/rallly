import { Button } from "@rallly/ui/button";
import { DialogTrigger } from "@rallly/ui/dialog";
import { Icon } from "@rallly/ui/icon";
import { SidebarTrigger } from "@rallly/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@rallly/ui/tooltip";
import { SettingsIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";

import { PayWallDialog } from "@/components/pay-wall-dialog";
import { Trans } from "@/components/trans";
import { IfFreeUser } from "@/contexts/plan";
import { getBrowserTimeZone } from "@/utils/date-time-utils";

import { ProBadge } from "./pro-badge";

export default function TopBar({ timeZone }: { timeZone?: string }) {
  return (
    <div className="bg-background/90 sticky top-0 z-10 flex items-center gap-4 rounded-t-lg border-b p-3 backdrop-blur-md">
      <div className="flex-1">
        <div className="flex items-center gap-x-2">
          <SidebarTrigger />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-end gap-x-4">
        <div className="flex items-center gap-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/settings/preferences">
                    <Icon>
                      <SettingsIcon />
                    </Icon>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <Trans i18nKey="settings" defaults="Settings" />
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button size="sm" variant="ghost" asChild>
            <Link href="/settings/preferences">
              {timeZone ?? getBrowserTimeZone()}
            </Link>
          </Button>
          <ProBadge />
          <IfFreeUser>
            <PayWallDialog>
              <DialogTrigger>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-primary hover:bg-primary-50"
                      >
                        <SparklesIcon className="size-4" />
                        <Trans i18nKey="upgrade" defaults="Upgrade" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <Trans i18nKey="upgradeToPro" defaults="Upgrade to Pro" />
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </DialogTrigger>
            </PayWallDialog>
          </IfFreeUser>
        </div>
      </div>
    </div>
  );
}
