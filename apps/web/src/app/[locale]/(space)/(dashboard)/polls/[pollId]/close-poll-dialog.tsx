"use client";

import { Button } from "@rallly/ui/button";
import type { DialogProps } from "@rallly/ui/dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import { closePollAction } from "@/features/poll/actions";
import { Trans } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export function ClosePollDialog({
  pollId,
  ...props
}: DialogProps & { pollId: string }) {
  const closePoll = useSafeAction(closePollAction, {
    onSuccess: () => {
      props.onOpenChange?.(false);
    },
  });

  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="closePollDialogTitle" defaults="Close poll" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="closePollDialogDescription"
              defaults="Participants will no longer be able to submit or update responses. You can reopen the poll at any time."
            />
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button />}>
            <Trans i18nKey="cancel" defaults="Cancel" />
          </DialogClose>
          <Button
            variant="primary"
            loading={closePoll.isExecuting}
            onClick={() => {
              closePoll.execute({ pollId });
            }}
          >
            <Trans i18nKey="closePollDialogTitle" defaults="Close poll" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
