"use client";

import {
  ActionBar,
  ActionBarContent,
  ActionBarGroup,
} from "@rallly/ui/action-bar";
import { Button } from "@rallly/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { TrashIcon } from "lucide-react";
import * as React from "react";

import { Trans } from "@/components/trans";

type SelectionActionBarProps = {
  selectedCount: number;
  onDelete: () => void;
  onClearSelection: () => void;
};

const MActionBar = motion(ActionBar);

export const SelectionActionBar = React.memo(function SelectionActionBar({
  selectedCount,
  onDelete,
  onClearSelection,
}: SelectionActionBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <MActionBar
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 20,
            mass: 1,
          }}
        >
          <ActionBarContent>
            <span className="text-sm font-medium">
              <Trans
                i18nKey="pollsSelected"
                defaults="{count} {count, plural, one {poll} other {polls}} selected"
                values={{ count: selectedCount }}
              />
            </span>
          </ActionBarContent>
          <ActionBarGroup>
            <Button
              variant="ghost"
              onClick={onClearSelection}
              className="text-action-bar-foreground"
            >
              <Trans i18nKey="clearSelection" defaults="Clear selection" />
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              <TrashIcon className="size-4" />
              <Trans i18nKey="delete" defaults="Delete" />
            </Button>
          </ActionBarGroup>
        </MActionBar>
      )}
    </AnimatePresence>
  );
});
