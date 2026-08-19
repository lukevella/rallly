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
import { toast } from "@rallly/ui/sonner";
import { useAction } from "next-safe-action/hooks";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { InputOTP } from "@/components/input-otp";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { useAuthedUser } from "@/features/user/client";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import {
  deleteAccountAction,
  requestAccountDeletionCodeAction,
} from "../actions";

const otpSchema = z.object({ otp: z.string().regex(/^\d{6}$/) });

function ConfirmStep({ onCodeSent }: { onCodeSent: () => void }) {
  // useAction directly, not useSafeAction: the latter refreshes the router on
  // success, which re-renders the tree this dialog sits in mid-flow. Sending a
  // code changes nothing on the page, so there is nothing to refresh.
  const user = useAuthedUser();
  const { t } = useTranslation();
  const requestCode = useAction(requestAccountDeletionCodeAction, {
    onSuccess: onCodeSent,
    // Bypassing useSafeAction also bypasses its error toast, so failures
    // here would otherwise be silent — the action is rate limited, so that
    // is a state real users can reach.
    onError: ({ error }) => {
      if (!error.serverError) {
        return;
      }

      toast.error(
        error.serverError === "TOO_MANY_REQUESTS"
          ? t("actionErrorTooManyRequests", {
              defaultValue: "You are making too many requests",
            })
          : t("actionErrorInternalServerError", {
              defaultValue: "An internal server error occurred",
            }),
      );
    },
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
            defaults="This account and everything in it will be permanently deleted. This cannot be undone."
          />
        </DialogDescription>
      </DialogHeader>
      {/* The account is shown rather than named in a sentence: this is the
          one thing worth checking before an irreversible action, and it is
          easier to check as a labelled row than mid-paragraph. */}
      <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
        <OptimizedAvatarImage size="lg" src={user.image} name={user.name} />
        <div className="min-w-0 flex-1 text-sm">
          <div className="truncate font-medium">{user.name}</div>
          <div className="truncate text-muted-foreground text-xs">
            {user.email}
          </div>
        </div>
      </div>
      <p className="text-muted-foreground text-sm">
        <Trans
          i18nKey="deleteAccountDialogCodeHint"
          defaults="We'll email a verification code to confirm it's you."
        />
      </p>
      <DialogFooter>
        <DialogClose render={<Button />}>
          <Trans i18nKey="cancel" defaults="Cancel" />
        </DialogClose>
        <Button
          type="button"
          variant="primary"
          loading={requestCode.isExecuting}
          onClick={() => requestCode.execute()}
        >
          <Trans
            i18nKey="deleteAccountRequestCode"
            defaults="Request verification code"
          />
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
              defaults="Enter the 6 digit code we sent to {email}."
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
            <Trans
              i18nKey="deleteAccountPermanently"
              defaults="Permanently delete account"
            />
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
}: {
  /** Rendered as the dialog trigger; the caller styles it and wires aria labels. */
  trigger: React.ReactElement;
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
      {/* The code step is narrower: six OTP boxes are a fixed width, and at
          the default size they leave a stretch of empty dialog beside them. */}
      <DialogContent size={codeSent ? "sm" : "md"}>
        {codeSent ? (
          <VerifyStep onBack={() => setCodeSent(false)} />
        ) : (
          <ConfirmStep onCodeSent={() => setCodeSent(true)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
