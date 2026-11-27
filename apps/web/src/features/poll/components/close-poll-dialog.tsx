"use client";

import { Button } from "@rallly/ui/button";
import type { DialogProps } from "@rallly/ui/dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import { useRouter } from "next/navigation";
import { Trans } from "@/i18n/client";
import { trpc } from "@/trpc/client";

export function ClosePollDialog({
  pollId,
  ...props
}: DialogProps & { pollId: string }) {
  const router = useRouter();
  // The page is server rendered, so the new status shows once it refreshes.
  const closePoll = trpc.polls.close.useMutation({
    onSuccess: () => {
      props.onOpenChange?.(false);
      router.refresh();
    },
  });
  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="closePollDialogTitle" defaults="Close poll?" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="closePollDialogDescription"
              defaults="Participants won't be able to add or change their responses. You can reopen the poll at any time."
            />
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => props.onOpenChange?.(false)}>
            <Trans i18nKey="cancel" defaults="Cancel" />
          </Button>
          <Button
            variant="primary"
            loading={closePoll.isPending}
            onClick={() => closePoll.mutate({ pollId })}
          >
            <Trans i18nKey="closePollDialogConfirm" defaults="Close poll" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
