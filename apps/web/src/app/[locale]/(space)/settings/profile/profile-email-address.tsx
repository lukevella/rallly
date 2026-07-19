"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { Button } from "@rallly/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { CheckCircleIcon, InfoIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { InputOTP } from "@/components/input-otp";
import { useAuthedUser } from "@/features/user/components/user-provider";
import { Trans, useTranslation } from "@/i18n/client";
import { authClient } from "@/lib/auth-client";

const emailChangeFormData = z.object({
  email: z.email(),
});

const verifyEmailChangeFormData = z.object({
  otp: z.string().regex(/^\d{6}$/),
});

function VerifyEmailChangeForm({
  newEmail,
  onSuccess,
  onCancel,
}: {
  newEmail: string;
  onSuccess: () => Promise<void> | void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const form = useForm({
    defaultValues: {
      otp: "",
    },
    resolver: zodResolver(verifyEmailChangeFormData),
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

    await onSuccess();
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-y-4">
          <Alert>
            <InfoIcon />
            <AlertTitle>
              <Trans
                i18nKey="emailChangeRequestSent"
                defaults="Verify your new email address"
              />
            </AlertTitle>
            <AlertDescription>
              <p>
                <Trans
                  i18nKey="emailChangeVerifyDescription"
                  defaults="Enter the 6 digit verification code we sent to {email}."
                  values={{ email: newEmail }}
                />
              </p>
            </AlertDescription>
          </Alert>
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
          <div className="mt-4 flex gap-x-2">
            <Button
              loading={form.formState.isSubmitting}
              type="submit"
              variant="primary"
            >
              <Trans i18nKey="verify" defaults="Verify" />
            </Button>
            <Button type="button" onClick={onCancel}>
              <Trans i18nKey="cancel" />
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

export const ProfileEmailAddress = () => {
  const user = useAuthedUser();
  const router = useRouter();
  const { t } = useTranslation();

  const [pendingEmail, setPendingEmail] = React.useState<string | null>(null);
  const [didChangeEmail, setDidChangeEmail] = React.useState(false);

  const form = useForm({
    defaultValues: {
      email: user.email,
    },
    resolver: zodResolver(emailChangeFormData),
  });

  const { handleSubmit, formState, reset } = form;

  if (pendingEmail) {
    return (
      <VerifyEmailChangeForm
        newEmail={pendingEmail}
        onCancel={() => {
          setPendingEmail(null);
          reset({ email: user.email });
        }}
        onSuccess={() => {
          reset({ email: pendingEmail });
          setPendingEmail(null);
          setDidChangeEmail(true);
          // The change-email endpoint refreshes the session snapshot, so a
          // refresh re-renders the layouts with the new email.
          router.refresh();
        }}
      />
    );
  }

  return (
    <div className="grid gap-y-4">
      <Form {...form}>
        <form
          onSubmit={handleSubmit(async (data) => {
            if (data.email === user.email) {
              return;
            }

            setDidChangeEmail(false);

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

            setPendingEmail(data.email);
          })}
        >
          <div className="flex flex-col gap-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans i18nKey="email" />
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      disabled={form.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {didChangeEmail ? (
              <Alert variant="success">
                <CheckCircleIcon />
                <AlertDescription>
                  <p>
                    <Trans
                      i18nKey="emailChangeSuccess"
                      defaults="Email changed successfully"
                    />
                  </p>
                </AlertDescription>
              </Alert>
            ) : null}
            <div className="mt-4 flex">
              <Button
                loading={formState.isSubmitting}
                type="submit"
                disabled={!formState.isDirty}
              >
                <Trans i18nKey="save" />
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};
