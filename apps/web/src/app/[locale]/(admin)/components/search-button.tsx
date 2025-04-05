"use client";

import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@rallly/ui/tooltip";
import { SearchIcon } from "lucide-react";
import * as React from "react";

import { useCommandDialog } from "@/components/command-dialog";
import { Trans } from "@/components/trans";

export function SearchButton() {
  const { toggle } = useCommandDialog();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-lg"
            id="command-dialog-trigger"
            onClick={toggle}
          >
            <Icon>
              <SearchIcon />
            </Icon>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <Trans i18nKey="searchButtonCommand" defaults="Command Menu" />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
