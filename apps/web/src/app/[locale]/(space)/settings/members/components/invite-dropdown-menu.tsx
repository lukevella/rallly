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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Icon } from "@rallly/ui/icon";
import { toast } from "@rallly/ui/sonner";
import { MoreHorizontalIcon, XIcon } from "lucide-react";
import { Trans } from "@/components/trans";
import { cancelInviteAction } from "@/features/space/actions";
import { useSpace } from "@/features/space/client";
import { useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

type SpaceMemberInvite = {
  id: string;
  email: string;
  spaceId: string;
};

export function InviteDropdownMenu({ invite }: { invite: SpaceMemberInvite }) {
  const space = useSpace();
  const cancelInviteDialog = useDialog();
  const cancelInvite = useSafeAction(cancelInviteAction);
  const { t } = useTranslation();

  const canCancelInvite = space
    .getMemberAbility()
    .can("delete", subject("SpaceMemberInvite", invite));

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Icon>
              <MoreHorizontalIcon />
            </Icon>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              cancelInviteDialog.trigger();
            }}
            disabled={!canCancelInvite}
            className="text-destructive"
          >
            <XIcon className="size-4" />
            <Trans i18nKey="cancelInvite" defaults="Cancel invite" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog {...cancelInviteDialog.dialogProps}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="cancelInvite" defaults="Cancel Invite" />
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
              onClick={() => {
                toast.promise(
                  cancelInvite.executeAsync({
                    inviteId: invite.id,
                  }),
                  {
                    loading: t("cancelingInvite", {
                      defaultValue: "Canceling invite...",
                    }),
                    success: t("inviteCanceledSuccess", {
                      defaultValue: "Invite canceled successfully",
                    }),
                    error: t("inviteCanceledError", {
                      defaultValue: "Failed to cancel invite",
                    }),
                  },
                );
                cancelInviteDialog.dismiss();
              }}
            >
              <Trans i18nKey="confirm" defaults="Confirm" />
            </Button>
            <DialogClose asChild>
              <Button>
                <Trans i18nKey="cancel" defaults="Cancel" />
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
