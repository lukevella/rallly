"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { usePostHog } from "@rallly/posthog/client";
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

import { Trans, useTranslation } from "@/i18n/client";
import { authClient } from "@/lib/auth-client";
import { validateRedirectUrl } from "@/utils/redirect";
import { InputOTP } from "../../../../../../components/input-otp";

const otpFormSchema = z.object({
  otp: z.string().length(6),
});

export function OTPForm({ email }: { email: string }) {
  const { t } = useTranslation();
  const posthog = usePostHog();
  const form = useForm({
    defaultValues: {
      otp: "",
    },
    resolver: zodResolver(otpFormSchema),
  });

  const searchParams = useSearchParams();
  const handleSubmit = form.handleSubmit(async (data) => {
    const res = await authClient.emailOtp.verifyEmail({
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
      }
    } else {
      window.location.href =
        validateRedirectUrl(searchParams?.get("redirectTo")) ?? "/";
    }
  });

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => {
            return (
              <FormItem>
                <FormControl>
                  <InputOTP
                    large
                    placeholder={t("verificationCodePlaceholder")}
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
                <FormDescription>
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
          <Trans i18nKey="login" defaults="Login" />
        </Button>
      </form>
    </Form>
  );
}
