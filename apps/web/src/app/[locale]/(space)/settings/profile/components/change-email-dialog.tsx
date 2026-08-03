"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { toast } from "@rallly/ui/sonner";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { InputOTP } from "@/components/input-otp";
import { Trans, useTranslation } from "@/i18n/client";
import { authClient } from "@/lib/auth-client";

const requestEmailChangeSchema = z.object({
  email: z.email(),
});

const verifyEmailChangeSchema = z.object({
  otp: z.string().regex(/^\d{6}$/),
});

function RequestEmailChangeForm({
  currentEmail,
  onSuccess,
}: {
  currentEmail: string;
  onSuccess: (newEmail: string) => void;
}) {
  const { t } = useTranslation();
  const form = useForm({
    defaultValues: { email: currentEmail },
    resolver: zodResolver(requestEmailChangeSchema),
  });

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (data) => {
          if (data.email === currentEmail) {
            form.setError("email", {
              message: t("emailChangeSameAddress", {
                defaultValue: "This is already your email address",
              }),
            });
            return;
          }

          const res = await authClient.emailOtp.requestEmailChange({
            newEmail: data.email,
          });

          if (res.error) {
            form.setError("email", {
              message: t("emailChangeRequestError", {
                defaultValue:
                  "We couldn't process this request. Please try again later.",
              }),
            });
            return;
          }

          onSuccess(data.email);
        })}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans i18nKey="newEmailAddress" defaults="New email address" />
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  autoFocus={true}
                  disabled={form.formState.isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <DialogClose render={<Button />}>
            <Trans i18nKey="cancel" defaults="Cancel" />
          </DialogClose>
          <Button
            type="submit"
            variant="primary"
            loading={form.formState.isSubmitting}
          >
            <Trans i18nKey="continue" defaults="Continue" />
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function VerifyEmailChangeForm({
  newEmail,
  onSuccess,
  onBack,
}: {
  newEmail: string;
  onSuccess: () => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const form = useForm({
    defaultValues: { otp: "" },
    resolver: zodResolver(verifyEmailChangeSchema),
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    const res = await authClient.emailOtp.changeEmail({
      newEmail,
      otp: data.otp,
    });

    if (res.error) {
      switch (res.error.code) {
        case "INVALID_OTP":
          form.setError("otp", {
            message: t("wrongVerificationCode", {
              defaultValue: "Your verification code is incorrect",
            }),
          });
          break;
        case "OTP_EXPIRED":
          form.setError("otp", {
            message: t("expiredVerificationCode", {
              defaultValue:
                "This code has expired. Request a new one to continue.",
            }),
          });
          break;
        case "TOO_MANY_ATTEMPTS":
          form.setError("otp", {
            message: t("tooManyVerificationAttempts", {
              defaultValue:
                "Too many incorrect attempts. Request a new code to continue.",
            }),
          });
          break;
        default:
          form.setError("otp", {
            message: t("emailChangeVerifyError", {
              defaultValue: "Verification failed. Please try again.",
            }),
          });
      }
      return;
    }

    onSuccess();
  });

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputOTP
                  disabled={form.formState.isSubmitting}
                  autoFocus={true}
                  onValidCode={() => {
                    handleSubmit();
                  }}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" onClick={onBack}>
            <Trans i18nKey="back" defaults="Back" />
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={form.formState.isSubmitting}
          >
            <Trans i18nKey="verify" defaults="Verify" />
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function ChangeEmailDialog({
  email,
  onOpenChange,
  ...rest
}: DialogProps & { email: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [pendingEmail, setPendingEmail] = React.useState<string | null>(null);

  return (
    <Dialog
      {...rest}
      onOpenChange={(open) => {
        // Start from the first step each time the dialog is reopened
        if (!open) {
          setPendingEmail(null);
        }
        onOpenChange?.(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="changeEmailAddress" defaults="Change email" />
          </DialogTitle>
          <DialogDescription>
            {pendingEmail ? (
              <Trans
                i18nKey="emailChangeVerifyDescription"
                defaults="Enter the 6 digit verification code we sent to {email}."
                values={{ email: pendingEmail }}
              />
            ) : (
              <Trans
                i18nKey="changeEmailAddressDescription"
                defaults="We'll send a verification code to your new address to confirm the change."
              />
            )}
          </DialogDescription>
        </DialogHeader>
        {pendingEmail ? (
          <VerifyEmailChangeForm
            newEmail={pendingEmail}
            onBack={() => setPendingEmail(null)}
            onSuccess={() => {
              setPendingEmail(null);
              onOpenChange?.(false);
              toast.success(
                t("emailChangeSuccess", {
                  defaultValue: "Email changed successfully",
                }),
              );
              // The change-email endpoint refreshes the session snapshot, so a
              // refresh re-renders the layouts with the new email.
              router.refresh();
            }}
          />
        ) : (
          <RequestEmailChangeForm
            currentEmail={email}
            onSuccess={setPendingEmail}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
