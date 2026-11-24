"use client";

import { Button } from "@rallly/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { SearchIcon } from "lucide-react";
import React from "react";
import {
  useCommandMenu,
  useSearchIndexPrefetch,
} from "@/features/navigation/client";
import { Trans, useTranslation } from "@/i18n/client";

// The platform is only known in the browser; render nothing until mount so
// the server and client agree.
function ShortcutHint() {
  const [modifier, setModifier] = React.useState<string | null>(null);
  React.useEffect(() => {
    setModifier(navigator.userAgent.includes("Mac") ? "⌘" : "Ctrl+");
  }, []);

  if (!modifier) {
    return null;
  }

  return <kbd className="ml-2 font-sans opacity-75">{modifier}K</kbd>;
}

export function SearchButton() {
  const { open } = useCommandMenu();
  const prefetchSearchIndex = useSearchIndexPrefetch();
  const { t } = useTranslation();
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("search", { defaultValue: "Search" })}
            aria-keyshortcuts="Meta+K Control+K"
            onClick={open}
            onPointerEnter={prefetchSearchIndex}
            onFocus={prefetchSearchIndex}
          />
        }
      >
        <SearchIcon />
      </TooltipTrigger>
      <TooltipContent>
        <Trans i18nKey="search" defaults="Search" />
        <ShortcutHint />
      </TooltipContent>
    </Tooltip>
  );
}
