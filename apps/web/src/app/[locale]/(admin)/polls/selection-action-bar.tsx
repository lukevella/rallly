"use client";

import { Button } from "@rallly/ui/button";
import { TrashIcon, XIcon } from "lucide-react";
import React from "react";

import { Trans } from "@/components/trans";

type SelectionActionBarProps = {
  selectedCount: number;
  onDelete: () => void;
  onClearSelection: () => void;
};

export const SelectionActionBar = React.memo(function SelectionActionBar({
  selectedCount,
  onDelete,
  onClearSelection,
}: SelectionActionBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="sticky bottom-8 z-10 mt-auto flex justify-center">
      <div className="text-primary-foreground flex items-center justify-between gap-4 rounded-xl bg-gray-900 p-2 shadow-lg">
        <div>
          <span className="px-2.5 text-sm font-medium">
            {selectedCount} {selectedCount === 1 ? "poll" : "polls"} selected
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={onClearSelection}
            className="text-primary-foreground hover:text-primary-foreground hover:bg-white/10"
          >
            <XIcon className="mr-1 size-4" />
            Clear
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            <TrashIcon className="mr-2 size-4" />
            <Trans i18nKey="delete" defaults="Delete" />
          </Button>
        </div>
      </div>
    </div>
  );
});
