"use client";

import {
  ActionBarContainer,
  ActionBarContent,
  ActionBarGroup,
  ActionBarPortal,
} from "@rallly/ui/action-bar";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import { AnimatePresence, motion } from "framer-motion";
import { TrashIcon } from "lucide-react";
import * as React from "react";

import { deletePolls } from "@/app/[locale]/(admin)/polls/actions";
import { Trans } from "@/components/trans";

import { usePollSelection } from "./context";

const MActionBar = motion(ActionBarContainer);

export function PollSelectionActionBar() {
  const { selectedCount, clearSelection, getSelectedPollIds } =
    usePollSelection();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    const selectedPollIds = getSelectedPollIds();
    if (selectedPollIds.length === 0) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deletePolls(selectedPollIds);

      if (result.success) {
        setIsDeleteDialogOpen(false);
        clearSelection();
      } else {
        // Handle error case
        console.error("Failed to delete polls:", result.error);
      }
    } finally {
      setIsDeleting(false);
    }
  };

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
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <TrashIcon className="size-4" />
                <Trans i18nKey="delete" defaults="Delete" />
              </Button>
            </ActionBarGroup>
          </MActionBar>
        )}
      </AnimatePresence>

      {/* Delete Polls Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="deletePolls" defaults="Delete Polls" />
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            {selectedCount === 1 ? (
              <Trans
                i18nKey="deletePollDescription"
                defaults="Are you sure you want to delete this poll? This action cannot be undone."
              />
            ) : (
              <Trans
                i18nKey="deletePollsDescription"
                defaults="Are you sure you want to delete these {count} polls? This action cannot be undone."
                values={{ count: selectedCount }}
              />
            )}
          </p>
          <DialogFooter>
            <Button
              onClick={() => {
                setIsDeleteDialogOpen(false);
              }}
            >
              <Trans i18nKey="cancel" defaults="Cancel" />
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              loading={isDeleting}
            >
              <Trans i18nKey="delete" defaults="Delete" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ActionBarPortal>
  );
}
