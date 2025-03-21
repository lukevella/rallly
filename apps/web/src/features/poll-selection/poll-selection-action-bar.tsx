"use client";

import {
  ActionBarContainer,
  ActionBarContent,
  ActionBarGroup,
  ActionBarPortal,
} from "@rallly/ui/action-bar";
import { Button } from "@rallly/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { TrashIcon } from "lucide-react";
import * as React from "react";

import { Trans } from "@/components/trans";
import { usePollSelection } from "@/features/poll-selection/context";

const MActionBar = motion(ActionBarContainer);

export const PollSelectionActionBar = React.memo(
  function PollSelectionActionBar() {
    const { selectedCount, clearSelection } = usePollSelection();

    return (
      <ActionBarPortal>
        <AnimatePresence>
          {selectedCount > 0 && (
            <MActionBar
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                mass: 0.5,
              }}
            >
              <ActionBarContent>
                <span className="text-sm font-medium">
                  <Trans
                    i18nKey="selectedPolls"
                    defaults="{count} {count, plural, one {poll} other {polls}} selected"
                    values={{ count: selectedCount }}
                  />
                </span>
              </ActionBarContent>
              <ActionBarGroup>
                <Button
                  variant="actionBar"
                  onClick={clearSelection}
                  className="text-action-bar-foreground"
                >
                  <Trans i18nKey="unselectAll" defaults="Unselect All" />
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    // handle delete
                  }}
                >
                  <TrashIcon className="size-4" />
                  <Trans i18nKey="delete" defaults="Delete" />
                </Button>
              </ActionBarGroup>
            </MActionBar>
          )}
        </AnimatePresence>
      </ActionBarPortal>
    );
  },
);
