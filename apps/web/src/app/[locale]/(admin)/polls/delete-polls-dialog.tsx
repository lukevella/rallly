"use client";

import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import * as React from "react";

import { Trans } from "@/components/trans";

import { deletePolls } from "./actions";

interface DeletePollsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pollIds: string[];
  onSuccess?: () => void;
}

export const DeletePollsDialog: React.FunctionComponent<
  DeletePollsDialogProps
> = ({ open, onOpenChange, pollIds, onSuccess }) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (pollIds.length === 0) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deletePolls(pollIds);

      if (result.success) {
        onOpenChange(false);
        onSuccess?.();
      } else {
        // Handle error case
        console.error("Failed to delete polls:", result.error);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="deletePoll" defaults="Delete Polls" />
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm">
          {pollIds.length === 1 ? (
            <Trans
              i18nKey="deletePollDescription"
              defaults="Are you sure you want to delete this poll? This action cannot be undone."
            />
          ) : (
            <Trans
              i18nKey="deletePollDescription"
              defaults="Are you sure you want to delete these {count} polls? This action cannot be undone."
              values={{ count: pollIds.length }}
            />
          )}
        </p>
        <DialogFooter>
          <Button
            onClick={() => {
              onOpenChange(false);
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
  );
};
