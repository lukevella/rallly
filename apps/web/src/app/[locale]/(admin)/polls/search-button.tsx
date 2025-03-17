"use client";

import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { SearchIcon } from "lucide-react";
import * as React from "react";

import { SearchPollsDialog } from "./search-polls-dialog";

export function SearchButton() {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  // Handle keyboard shortcut (Cmd+K or Ctrl+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <Button size="icon" variant="ghost" onClick={() => setIsSearchOpen(true)}>
        <Icon>
          <SearchIcon />
        </Icon>
      </Button>

      <SearchPollsDialog
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
      />
    </>
  );
}
