"use client";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Field, FieldError, FieldGroup } from "@rallly/ui/field";
import { Form } from "@rallly/ui/form";
import { useAction } from "next-safe-action/hooks";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { InputOTP } from "@/components/input-otp";
import { useAuthedUser } from "@/features/user/client";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import {
  deleteAccountAction,
  requestAccountDeletionCodeAction,
} from "../actions";

const otpSchema = z.object({ otp: z.string().regex(/^\d{6}$/) });

function ConfirmStep({
  summary,
  onCodeSent,
}: {
  summary?: React.ReactNode;
  onCodeSent: () => void;
}) {
  // useAction directly, not useSafeAction: the latter calls router.refresh()
  // on success, which re-renders the streamed summary this dialog is mounted
  // under and resets the step back to the start. Nothing on the page changes
  // when a code is sent, so there is nothing to refresh.
  const requestCode = useAction(requestAccountDeletionCodeAction, {
    onSuccess: onCodeSent,
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          <Trans i18nKey="deleteAccountDialogTitle" defaults="Delete account" />
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
      </div>
      <DialogFooter>
        <DialogClose render={<Button />}>
          <Trans i18nKey="cancel" defaults="Cancel" />
        </DialogClose>
        <Button
          type="button"
          variant="destructive"
          loading={requestCode.isExecuting}
          onClick={() => requestCode.execute()}
        >
          <Trans i18nKey="continue" defaults="Continue" />
        </Button>
      </DialogFooter>
    </>
  );
}

function VerifyStep({ onBack }: { onBack: () => void }) {
  const user = useAuthedUser();
  const { t } = useTranslation();
  const form = useForm({
    defaultValues: { otp: "" },
    resolver: zodResolver(otpSchema),
  });
  const { formState } = form;

  const deleteAccount = useSafeAction(deleteAccountAction);

  const handleSubmit = form.handleSubmit(async (data) => {
    const result = await deleteAccount.executeAsync({ otp: data.otp });

    if (result?.data?.ok === false) {
      form.setError("otp", {
        message: t("deleteAccountInvalidCode", {
          defaultValue:
            "This code is incorrect or has expired. Request a new one to continue.",
        }),
      });
      return;
    }

    // Anything other than an explicit success leaves the dialog open;
    // useSafeAction has already surfaced a serverError as a toast.
    if (result?.data?.ok !== true) {
      return;
    }

    // The action signs out server-side, so the session cookies are already
    // cleared on this response; a full load picks that up.
    window.location.href = "/";
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>
            <Trans
              i18nKey="deleteAccountVerifyTitle"
              defaults="Confirm your account deletion"
            />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="deleteAccountVerifyDescription"
              defaults="Enter the 6 digit code we sent to {email} to permanently delete your account."
              values={{ email: user.email }}
            />
          </DialogDescription>
        </DialogHeader>
        <FieldGroup className="py-4">
          <Controller
            control={form.control}
            name="otp"
            render={({ field, fieldState }) => (
              <Field>
                <InputOTP
                  {...field}
                  disabled={formState.isSubmitting}
                  autoFocus={true}
                  onValidCode={() => {
                    handleSubmit();
                  }}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </FieldGroup>
        <DialogFooter>
          <Button type="button" onClick={onBack}>
            <Trans i18nKey="back" defaults="Back" />
          </Button>
          <Button
            type="submit"
            variant="destructive"
            loading={formState.isSubmitting}
          >
            <Trans i18nKey="deleteAccount" defaults="Delete account" />
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

// Deletion is immediate and irreversible, so it is gated on a code sent to the
// account email: the session alone is not proof of intent.
export function DeleteAccountDialog({
  trigger,
  summary,
}: {
  /** Rendered as the dialog trigger; the caller styles it and wires aria labels. */
  trigger: React.ReactElement;
  summary?: React.ReactNode;
}) {
  const dialog = useDialog();
  const [codeSent, setCodeSent] = React.useState(false);

  return (
    <Dialog
      {...dialog.dialogProps}
      onOpenChange={(open) => {
        dialog.dialogProps.onOpenChange(open);
        if (!open) {
          setCodeSent(false);
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        {codeSent ? (
          <VerifyStep onBack={() => setCodeSent(false)} />
        ) : (
          <ConfirmStep summary={summary} onCodeSent={() => setCodeSent(true)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
