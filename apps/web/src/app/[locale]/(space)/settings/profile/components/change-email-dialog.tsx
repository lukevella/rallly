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
import { Field, FieldError, FieldGroup, FieldLabel } from "@rallly/ui/field";
import { Form } from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { toast } from "@rallly/ui/sonner";
import { useRouter } from "next/navigation";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { InputOTP } from "@/components/input-otp";
import { checkEmailAvailabilityAction } from "@/features/user/actions";
import { Trans, useTranslation } from "@/i18n/client";
import { authClient } from "@/lib/auth-client";
import { useSafeAction } from "@/lib/safe-action/client";

const emailSchema = z.object({
  email: z.email(),
});

const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/),
});

function RequestEmailChangeForm({
  currentEmail,
  onCodeSent,
}: {
  currentEmail: string;
  onCodeSent: (email: string) => void;
}) {
  const { t } = useTranslation();
  const emailId = React.useId();
  const checkEmailAvailability = useSafeAction(checkEmailAvailabilityAction);
  const form = useForm({
    defaultValues: { email: currentEmail },
    resolver: zodResolver(emailSchema),
  });
  const { formState } = form;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          // Better-Auth reports success without sending when the address is
          // taken, so the conflict has to be caught before that call.
          const availability = await checkEmailAvailability.executeAsync({
            email: data.email,
          });

          if (availability?.data?.ok === false) {
            form.setError(
              "email",
              {
                message:
                  availability.data.reason === "same_email"
                    ? t("emailChangeSameAddress", {
                        defaultValue:
                          "This is already your email address. Enter a different one.",
                      })
                    : t("emailChangeAddressTaken", {
                        defaultValue:
                          "This email address is already in use by another account.",
                      }),
              },
              { shouldFocus: true },
            );
            return;
          }

          if (!availability?.data?.ok) {
            form.setError("email", {
              message: t("emailChangeRequestError", {
                defaultValue:
                  "We couldn't process this request. Please try again later.",
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

          onCodeSent(data.email);
        })}
      >
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="changeEmail" defaults="Change email" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="changeEmailDescription"
              defaults="We'll send a verification code to your new email address"
            />
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="py-4">
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor={emailId}>
                  <Trans i18nKey="email" defaults="Email" />
                </FieldLabel>
                <Input
                  {...field}
                  id={emailId}
                  type="email"
                  autoComplete="email"
                  disabled={formState.isSubmitting}
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </FieldGroup>

        <DialogFooter>
          <DialogClose render={<Button />}>
            <Trans i18nKey="cancel" defaults="Cancel" />
          </DialogClose>
          <Button
            type="submit"
            variant="primary"
            loading={formState.isSubmitting}
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
  onBack,
  onVerified,
}: {
  newEmail: string;
  onBack: () => void;
  onVerified: () => void;
}) {
  const { t } = useTranslation();
  const form = useForm({
    defaultValues: { otp: "" },
    resolver: zodResolver(otpSchema),
  });
  const { formState } = form;

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
          // The address can be claimed between the availability check and
          // this call, and Better-Auth only reports the conflict here.
          form.setError(
            "otp",
            res.error.message === "Email already in use"
              ? {
                  message: t("emailChangeAddressTaken", {
                    defaultValue:
                      "This email address is already in use by another account.",
                  }),
                }
              : {
                  message: t("emailChangeVerifyError", {
                    defaultValue: "Verification failed. Please try again.",
                  }),
                },
          );
      }
      return;
    }

    onVerified();
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>
            <Trans
              i18nKey="emailChangeRequestSent"
              defaults="Verify your new email address"
            />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="emailChangeVerifyDescription"
              defaults="Enter the 6 digit verification code we sent to {email}."
              values={{ email: newEmail }}
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
            variant="primary"
            loading={formState.isSubmitting}
          >
            <Trans i18nKey="verify" defaults="Verify" />
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function ChangeEmailDialog({
  currentEmail,
  trigger,
}: {
  currentEmail: string;
  /** Rendered as the dialog trigger; the caller styles it and wires aria labels. */
  trigger: React.ReactElement;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const dialog = useDialog();
  const [pendingEmail, setPendingEmail] = React.useState<string | null>(null);

  return (
    <Dialog
      {...dialog.dialogProps}
      onOpenChange={(open) => {
        dialog.dialogProps.onOpenChange(open);
        if (!open) {
          setPendingEmail(null);
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        {pendingEmail ? (
          <VerifyEmailChangeForm
            newEmail={pendingEmail}
            onBack={() => setPendingEmail(null)}
            onVerified={() => {
              setPendingEmail(null);
              dialog.dismiss();
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
            currentEmail={currentEmail}
            onCodeSent={setPendingEmail}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
