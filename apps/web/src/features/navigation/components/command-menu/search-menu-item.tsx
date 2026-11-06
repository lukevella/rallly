"use client";

import { SidebarMenuButton, SidebarMenuItem } from "@rallly/ui/sidebar";
import { SearchIcon } from "lucide-react";
import React from "react";
import {
  useCommandMenu,
  useSearchIndexPrefetch,
} from "@/features/navigation/client";
import { Trans } from "@/i18n/client";

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

  return (
    <kbd className="ml-auto font-sans text-muted-foreground text-xs">
      {modifier}K
    </kbd>
  );
}

export function SearchMenuItem() {
  const { open } = useCommandMenu();
  const prefetchSearchIndex = useSearchIndexPrefetch();
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={open}
        onPointerEnter={prefetchSearchIndex}
        onFocus={prefetchSearchIndex}
        aria-keyshortcuts="Meta+K Control+K"
      >
        <SearchIcon />
        <Trans i18nKey="search" defaults="Search" />
        <ShortcutHint />
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
