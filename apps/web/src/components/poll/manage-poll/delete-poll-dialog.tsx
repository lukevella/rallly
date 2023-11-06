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
import * as React from "react";

import { Trans } from "@/components/trans";
import { usePostHog } from "@/utils/posthog";
import { trpc } from "@/utils/trpc/client";

export const DeletePollDialog: React.FunctionComponent<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  urlId: string;
}> = ({ open, onOpenChange, urlId }) => {
  const posthog = usePostHog();
  const queryClient = trpc.useUtils();
  const router = useRouter();
  const deletePoll = trpc.polls.delete.useMutation({
    onSuccess: () => {
      queryClient.polls.invalidate();
      posthog?.capture("deleted poll");
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
              deletePoll.mutate({ urlId });
            }}
            loading={deletePoll.isLoading}
          >
            <Trans i18nKey="delete" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
