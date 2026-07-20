"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { posthog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@rallly/ui/form";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { InputOTP } from "@/components/input-otp";
import { Trans, useTranslation } from "@/i18n/client";
import { authClient } from "@/lib/auth-client";
import { validateRedirectUrl } from "@/lib/utils/redirect";

const otpFormSchema = z.object({
  otp: z.string().length(6),
});

export function OTPForm({
  email,
  mode,
}: {
  email: string;
  /**
   * "sign-in" verifies with signIn.emailOtp, which creates an account when
   * the email is new. "email-verification" only signs into existing
   * accounts — used when registration is disabled.
   */
  mode: "sign-in" | "email-verification";
}) {
  const { t } = useTranslation();
  const form = useForm({
    defaultValues: {
      otp: "",
    },
    resolver: zodResolver(otpFormSchema),
  });

  const searchParams = useSearchParams();
  const handleSubmit = form.handleSubmit(async (data) => {
    const res =
      mode === "sign-in"
        ? await authClient.signIn.emailOtp({
            email,
            otp: data.otp,
          })
        : await authClient.emailOtp.verifyEmail({
            email,
            otp: data.otp,
          });

    if (res.error) {
      posthog?.capture("login:otp_verify_error", {
        error_code: res.error.code ?? "UNKNOWN",
        status: res.error.status,
      });

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
            message: res.error.message,
          });
          return;
      }
    }

    const redirectTo = validateRedirectUrl(searchParams?.get("redirectTo"));

    // A freshly created account has no name yet; send it through onboarding
    // to pick one up before continuing to its destination.
    if (mode === "sign-in" && !res.data?.user?.name) {
      window.location.href = redirectTo
        ? `/setup?redirectTo=${encodeURIComponent(redirectTo)}`
        : "/setup";
      return;
    }

    window.location.href = redirectTo ?? "/";
  });

  return (
    <Form {...form}>
      <form
        className="flex flex-col items-center space-y-6 text-center"
        onSubmit={handleSubmit}
      >
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => {
            return (
              <FormItem>
                <FormControl>
                  <InputOTP
                    disabled={
                      form.formState.isSubmitting ||
                      form.formState.isSubmitSuccessful
                    }
                    autoFocus={true}
                    onValidCode={() => {
                      handleSubmit();
                    }}
                    {...field}
                  />
                </FormControl>
                <FormDescription className="mt-4">
                  <Trans i18nKey="verificationCodeHelp" />
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <Button
          className="w-full"
          variant="primary"
          size="xl"
          type="submit"
          loading={
            form.formState.isSubmitting || form.formState.isSubmitSuccessful
          }
        >
          <Trans i18nKey="continue" defaults="Continue" />
        </Button>
      </form>
    </Form>
  );
}
