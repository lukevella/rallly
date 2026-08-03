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
import { Form, FormField, FormItem, FormMessage } from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { useForm } from "react-hook-form";
import { ACCOUNT_DELETION_GRACE_DAYS } from "@/features/user/account-deletion/constants";
import { useAuthedUser } from "@/features/user/client";
import { Trans, useTranslation } from "@/i18n/client";
import { signOut } from "@/lib/auth-client";
import { isSelfHosted } from "@/lib/constants";
import { useSafeAction } from "@/lib/safe-action/client";
import { deleteAccountAction, scheduleAccountDeletionAction } from "../actions";

export function DeleteAccountDialog(
  props: DialogProps & {
    summary?: React.ReactNode;
  },
) {
  if (isSelfHosted) {
    return <InstantDeleteAccountDialog {...props} />;
  }

  return <ScheduleAccountDeletionDialog {...props} />;
}

function ScheduleAccountDeletionDialog({
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
              i18nKey="deleteAccountDialogDataScope"
              defaults="All data associated with your account will be permanently deleted."
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

// Self-hosted instances delete immediately — no reaper, no recovery window —
// so the email confirmation step guards against an irreversible mistake.
function InstantDeleteAccountDialog({
  summary,
  ...rest
}: DialogProps & {
  summary?: React.ReactNode;
}) {
  const user = useAuthedUser();
  const { t } = useTranslation();
  const form = useForm<{ email: string }>({
    defaultValues: {
      email: "",
    },
  });

  const deleteAccount = useSafeAction(deleteAccountAction, {
    onSuccess: () => {
      // The server already revoked the session; sign out clears the cookies
      // before leaving the page.
      signOut()
        .catch(() => {})
        .finally(() => {
          window.location.href = "/";
        });
    },
  });

  return (
    <Form {...form}>
      <Dialog {...rest}>
        <DialogContent>
          <form
            onSubmit={form.handleSubmit(async () => {
              await deleteAccount.executeAsync();
            })}
          >
            <DialogHeader>
              <DialogTitle>
                <Trans
                  i18nKey="deleteAccountDialogTitle"
                  defaults="Delete Account"
                />
              </DialogTitle>
              <DialogDescription>
                <Trans
                  i18nKey="deleteAccountDialogDescription"
                  defaults="Are you sure you want to delete your account?"
                />
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4 text-sm">
              <p>
                <Trans
                  i18nKey="deleteAccountDialogDataScope"
                  defaults="All data associated with your account will be permanently deleted."
                />
              </p>
              {summary}
              <p>
                <Trans
                  i18nKey="deleteAccountDialogImmediateWarning"
                  defaults="Your account and data will be deleted immediately. This cannot be undone."
                />
              </p>
              <p>
                <Trans
                  i18nKey="deleteAccountInstruction"
                  defaults="Please confirm your email address to delete your account"
                />
              </p>
              <FormField
                control={form.control}
                name="email"
                rules={{
                  validate: (value) => {
                    if (value !== user.email) {
                      return t("emailMismatch", {
                        defaultValue: "Email does not match the account email",
                      });
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <Input
                      autoComplete="off"
                      data-1p-ignore
                      placeholder={user.email}
                      {...field}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button />}>
                <Trans i18nKey="cancel" defaults="Cancel" />
              </DialogClose>
              <Button
                type="submit"
                variant="destructive"
                loading={deleteAccount.isExecuting}
              >
                <Trans i18nKey="deleteAccount" defaults="Delete Account" />
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
