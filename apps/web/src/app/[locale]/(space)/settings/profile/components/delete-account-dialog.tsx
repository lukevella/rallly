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
import { ACCOUNT_DELETION_GRACE_DAYS } from "@/features/user/account-deletion/constants";
import { Trans } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { scheduleAccountDeletionAction } from "../actions";

export function DeleteAccountDialog({
  summary,
  ...rest
}: DialogProps & {
  summary?: React.ReactNode;
}) {
  const scheduleAccountDeletion = useSafeAction(scheduleAccountDeletionAction, {
    onSuccess: () => {
      rest.onOpenChange?.(false);
    },
  });

  return (
    <Dialog {...rest}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans
              i18nKey="deleteAccountDialogTitle"
              defaults="Delete Account"
            />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="deleteAccountDialogScheduleDescription"
              defaults="Your account will be scheduled for deletion."
            />
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p>
            <Trans
              i18nKey="deleteAccountDataWarning"
              defaults="All data associated with your account, including your polls, events, votes, and comments, will be permanently deleted."
            />
          </p>
          {summary}
          <p>
            <Trans
              i18nKey="deleteAccountRecoveryWindow"
              defaults="You can cancel the deletion within {count, plural, one {# day} other {# days}}. After that, your account and data will be permanently deleted."
              values={{ count: ACCOUNT_DELETION_GRACE_DAYS }}
            />
          </p>
        </div>
        <DialogFooter>
          <DialogClose render={<Button />}>
            <Trans i18nKey="cancel" defaults="Cancel" />
          </DialogClose>
          <Button
            variant="destructive"
            loading={scheduleAccountDeletion.isExecuting}
            onClick={() => scheduleAccountDeletion.executeAsync()}
          >
            <Trans i18nKey="deleteAccount" defaults="Delete Account" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
