import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import { useRouter } from "next/navigation";
import type * as React from "react";

import { Trans } from "@/i18n/client";
import { trpc } from "@/trpc/client";

export const DeletePollDialog: React.FunctionComponent<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  urlId: string;
}> = ({ open, onOpenChange, urlId }) => {
  const router = useRouter();
  const deletePoll = trpc.polls.markAsDeleted.useMutation({
    onSuccess: () => {
      onOpenChange(false);
      router.replace("/polls");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="deletePoll" />
          </DialogTitle>
          <DialogDescription>
            <Trans i18nKey="deletePollDescription" />
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={() => {
              onOpenChange(false);
            }}
          >
            <Trans i18nKey="cancel" />
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              deletePoll.mutate({ pollId: urlId });
            }}
            loading={deletePoll.isPending}
          >
            <Trans i18nKey="delete" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
