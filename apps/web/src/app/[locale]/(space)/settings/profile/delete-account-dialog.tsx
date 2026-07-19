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

import { scheduleAccountDeletionAction } from "@/features/user/actions";
import { ACCOUNT_DELETION_GRACE_DAYS } from "@/features/user/constants";
import { Trans } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export function DeleteAccountDialog({
  pollCount,
  eventCount,
  hasActiveSubscription,
  ...rest
}: DialogProps & {
  pollCount: number;
  eventCount: number;
  hasActiveSubscription: boolean;
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
        <div className="space-y-3 py-4 text-sm">
          <p>
            <Trans
              i18nKey="deleteAccountConsequences"
              defaults="Your {pollCount, plural, one {# poll} other {# polls}} and {eventCount, plural, one {# event} other {# events}}, along with all your votes and comments, will be permanently deleted."
              values={{ pollCount, eventCount }}
            />
          </p>
          {hasActiveSubscription ? (
            <p>
              <Trans
                i18nKey="deleteAccountSubscriptionWarning"
                defaults="Your Pro subscription will be cancelled immediately. You won't be refunded for remaining time, and cancelling the deletion will not restore your subscription."
              />
            </p>
          ) : null}
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
