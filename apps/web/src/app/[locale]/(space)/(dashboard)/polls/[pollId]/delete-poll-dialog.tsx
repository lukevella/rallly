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
import { useRouter } from "next/navigation";
import { deletePollAction } from "@/features/poll/actions";
import { Trans } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export function DeletePollDialog({
  pollId,
  ...props
}: DialogProps & { pollId: string }) {
  const router = useRouter();
  const deletePoll = useSafeAction(deletePollAction, {
    onSuccess: () => {
      router.replace("/polls");
    },
  });

  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="deletePoll" defaults="Delete poll" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="deletePollDescription"
              defaults="All data related to this poll will be deleted. This action cannot be undone."
            />
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button />}>
            <Trans i18nKey="cancel" defaults="Cancel" />
          </DialogClose>
          <Button
            variant="destructive"
            loading={deletePoll.isExecuting}
            onClick={() => {
              deletePoll.execute({ pollId });
            }}
          >
            <Trans i18nKey="delete" defaults="Delete" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
