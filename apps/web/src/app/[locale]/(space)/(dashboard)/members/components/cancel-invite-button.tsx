"use client";

import { subject } from "@casl/ability";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  useDialog,
} from "@rallly/ui/dialog";
import { toast } from "@rallly/ui/sonner";
import { useSpace } from "@/features/space/client";
import { cancelInviteAction } from "@/features/space/member/actions";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

type SpaceMemberInvite = {
  id: string;
  email: string;
  spaceId: string;
};

export function CancelInviteButton({ invite }: { invite: SpaceMemberInvite }) {
  const space = useSpace();
  const cancelInviteDialog = useDialog();
  const { t } = useTranslation();
  const cancelInvite = useSafeAction(cancelInviteAction, {
    onSuccess: () => {
      toast.success(
        t("inviteCanceledSuccess", {
          defaultValue: "Invite canceled successfully",
        }),
      );
    },
    onSettled: () => {
      cancelInviteDialog.dismiss();
    },
  });

  const canCancelInvite = space
    .getMemberAbility()
    .can("delete", subject("SpaceMemberInvite", invite));

  return (
    <>
      <Button
        size="sm"
        disabled={!canCancelInvite}
        onClick={() => {
          cancelInviteDialog.trigger();
        }}
      >
        <Trans i18nKey="cancel" defaults="Cancel" />
      </Button>
      <Dialog {...cancelInviteDialog.dialogProps}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="cancelInvite" defaults="Cancel invite" />
            </DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey="cancelInviteConfirmation"
                defaults="Are you sure you want to cancel the invite for {email}?"
                values={{ email: invite.email }}
              />
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              loading={cancelInvite.isExecuting}
              onClick={() => {
                cancelInvite.execute({ inviteId: invite.id });
              }}
            >
              <Trans i18nKey="confirm" defaults="Confirm" />
            </Button>
            <DialogClose render={<Button />}>
              <Trans i18nKey="cancel" defaults="Cancel" />
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
