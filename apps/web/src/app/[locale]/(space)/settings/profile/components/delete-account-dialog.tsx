"use client";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  useDialog,
} from "@rallly/ui/dialog";
import { Form, FormField, FormItem, FormMessage } from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { useForm } from "react-hook-form";
import { useAuthedUser } from "@/features/user/client";
import { Trans, useTranslation } from "@/i18n/client";
import { signOut } from "@/lib/auth-client";
import { useSafeAction } from "@/lib/safe-action/client";
import { deleteAccountAction } from "../actions";

// Deletion is immediate and irreversible, so the email confirmation step
// guards against a mistake there is no way back from.
export function DeleteAccountDialog({
  trigger,
  summary,
}: {
  /** Rendered as the dialog trigger; the caller styles it and wires aria labels. */
  trigger: React.ReactElement;
  summary?: React.ReactNode;
}) {
  const dialog = useDialog();
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
      <Dialog {...dialog.dialogProps}>
        <DialogTrigger render={trigger} />
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
                  defaults="Delete account"
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
                  i18nKey="deleteAccountDialogDataWarning"
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
                <Trans i18nKey="deleteAccount" defaults="Delete account" />
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
