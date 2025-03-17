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
    <div className="mt-auto sticky bottom-6 z-10 flex justify-center">
      <div className="bg-primary text-primary-foreground flex items-center justify-between gap-4 rounded-lg px-4 py-3 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="font-medium">
            {selectedCount} {selectedCount === 1 ? "poll" : "polls"} selected
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
            className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
          >
            <XIcon className="mr-1 size-4" />
            Clear
          </Button>
        </div>
        <Button
          size="sm"
          variant="destructive"
          onClick={onDelete}
          className="bg-white/20 hover:bg-white/30"
        >
          <TrashIcon className="mr-2 size-4" />
          <Trans i18nKey="delete" defaults="Delete" />
        </Button>
      </div>
    </div>
  );
});
