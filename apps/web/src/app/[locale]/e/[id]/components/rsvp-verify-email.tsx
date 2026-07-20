"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { TurnstileInstance } from "@marsidev/react-turnstile";
import { Turnstile } from "@marsidev/react-turnstile";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  useDialog,
} from "@rallly/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@rallly/ui/form";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { InputOTP } from "@/components/input-otp";
import { Trans, useTranslation } from "@/i18n/client";
import { authClient } from "@/lib/auth-client";
import { useFeatureFlag } from "@/lib/feature-flags/client";

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const otpSchema = z.object({ otp: z.string().regex(/^\d{6}$/) });

export function RsvpVerifyEmail({
  email,
  name,
}: {
  email: string;
  name: string;
}) {
  const isCaptchaEnabled = useFeatureFlag("captcha");
  const isTurnstileEnabled = isCaptchaEnabled && !!turnstileSiteKey;
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const dialog = useDialog();
  const turnstileRef = React.useRef<TurnstileInstance>(null);
  const [otpSent, setOtpSent] = React.useState(false);
  const form = useForm({
    defaultValues: { otp: "" },
    resolver: zodResolver(otpSchema),
  });

  const sendOtp = async (captchaToken?: string) => {
    const res = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
      fetchOptions: captchaToken
        ? {
            headers: {
              "x-captcha-response": captchaToken,
            },
          }
        : undefined,
    });

    if (res.error) {
      form.setError("otp", {
        message: t("rsvpVerifySendError", {
          defaultValue: "We couldn't send a code. Please try again.",
        }),
      });
      return;
    }

    setOtpSent(true);
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    // Verifying signs the guest in: into their existing account if the email
    // is already in use, otherwise into a freshly created one. The anonymous
    // session is linked, migrating their registration to the real account.
    // `name` is only applied when a new account is created.
    const res = await authClient.signIn.emailOtp({
      email,
      otp: data.otp,
      name,
    });

    if (res.error) {
      switch (res.error.code) {
        case "INVALID_OTP":
          form.setError("otp", {
            message: t("wrongVerificationCode", {
              defaultValue: "Your verification code is incorrect",
            }),
          });
          return;
        case "OTP_EXPIRED":
          form.setError("otp", {
            message: t("expiredVerificationCode", {
              defaultValue:
                "This code has expired. Request a new one to continue.",
            }),
          });
          return;
        case "TOO_MANY_ATTEMPTS":
          form.setError("otp", {
            message: t("tooManyVerificationAttempts", {
              defaultValue:
                "Too many incorrect attempts. Request a new code to continue.",
            }),
          });
          return;
        default:
          form.setError("otp", {
            message: t("rsvpVerifyError", {
              defaultValue: "We couldn't verify your email. Please try again.",
            }),
          });
          return;
      }
    }

    // A newly created account may come back without a name; set it from the
    // registration. Existing accounts keep their own name (we only fill a
    // missing one). updateUser also refreshes the session so the name shows
    // immediately.
    if (!res.data?.user?.name) {
      await authClient.updateUser({ name });
    }

    dialog.dismiss();
    router.refresh();
  });

  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-sm">
        <Trans
          i18nKey="rsvpVerifyPrompt"
          defaults="Verify your email to manage your registration from any device."
        />
      </p>
      <Button
        className="self-start"
        onClick={() => {
          form.reset();
          setOtpSent(false);
          dialog.trigger();
          // With Turnstile configured, the send waits for the widget in the
          // dialog to produce a token.
          if (!isTurnstileEnabled) {
            void sendOtp();
          }
        }}
      >
        <Trans i18nKey="rsvpVerifyCta" defaults="Verify your email" />
      </Button>
      <Dialog {...dialog.dialogProps}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="rsvpVerifyTitle" defaults="Verify your email" />
            </DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey="rsvpVerifyDialogDescription"
                defaults="Enter the 6-digit code we sent to {email}."
                values={{ email }}
              />
            </DialogDescription>
          </DialogHeader>
          {isTurnstileEnabled && turnstileSiteKey && !otpSent ? (
            <Turnstile
              ref={turnstileRef}
              siteKey={turnstileSiteKey}
              options={{
                language: i18n.language,
                size: "flexible",
                // Solves invisibly in the background; only shows up when
                // Cloudflare requires an interactive challenge.
                appearance: "interaction-only",
              }}
              onSuccess={(token) => {
                void sendOtp(token);
              }}
            />
          ) : null}
          <Form {...form}>
            <form onSubmit={handleSubmit}>
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <InputOTP
                        autoFocus
                        disabled={
                          form.formState.isSubmitting ||
                          (isTurnstileEnabled && !otpSent)
                        }
                        onValidCode={() => handleSubmit()}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
