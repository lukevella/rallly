"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import type { TurnstileInstance } from "@marsidev/react-turnstile";
import { Turnstile } from "@marsidev/react-turnstile";
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
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { sendRegistrationOtp } from "@/app/[locale]/(auth)/register/actions";
import { Trans, useTranslation } from "@/i18n/client";
import { validateRedirectUrl } from "@/lib/utils/redirect";

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const isTurnstileEnabled = !!turnstileSiteKey;

function useRegisterEmailFormSchema() {
  const { t } = useTranslation();
  return React.useMemo(() => {
    return z.object({
      email: z.email(t("validEmail")),
    });
  }, [t]);
}

export function RegisterEmailForm() {
  const schema = useRegisterEmailFormSchema();
  const { t, i18n } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const turnstileRef = React.useRef<TurnstileInstance>(null);
  const [turnstileToken, setTurnstileToken] = React.useState<string | null>(
    null,
  );
  const form = useForm({
    defaultValues: {
      email: "",
    },
    resolver: zodResolver(schema),
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async ({ email }) => {
          try {
            const res = await sendRegistrationOtp({
              email,
              captchaToken: turnstileToken ?? undefined,
            });

            if (!res.ok) {
              switch (res.code) {
                case "CAPTCHA_FAILED":
                  form.setError("root", {
                    message: t("captchaFailed", {
                      defaultValue: "Verification failed. Please try again.",
                    }),
                  });
                  break;
                case "EMAIL_BLOCKED":
                  form.setError("email", {
                    message: t("emailNotAllowed"),
                  });
                  break;
                case "TEMPORARY_EMAIL_NOT_ALLOWED":
                  form.setError("email", {
                    message: t("temporaryEmailNotAllowed"),
                  });
                  break;
                case "BANNED_USER":
                  form.setError("email", {
                    message: t("authErrorsUserBanned", {
                      defaultValue:
                        "This account has been banned. Please contact support if you believe this is an error.",
                    }),
                  });
                  break;
                default:
                  form.setError("email", {
                    message: t("registerOtpSendError", {
                      defaultValue: "Something went wrong. Please try again.",
                    }),
                  });
                  break;
              }
              return;
            }

            const validatedRedirectTo = validateRedirectUrl(
              searchParams.get("redirectTo"),
            );

            router.push(
              `/register/verify${
                validatedRedirectTo
                  ? `?redirectTo=${encodeURIComponent(validatedRedirectTo)}`
                  : ""
              }`,
            );
          } finally {
            if (isTurnstileEnabled) {
              setTurnstileToken(null);
              turnstileRef.current?.reset();
            }
          }
        })}
      >
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Trans i18nKey="email" defaults="Email" />
                </FormLabel>
                <FormControl>
                  <Input
                    large
                    type="email"
                    autoComplete="email"
                    placeholder={t("emailPlaceholder")}
                    disabled={form.formState.isSubmitting}
                    autoFocus={true}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {form.formState.errors.root?.message ? (
          <FormMessage>{form.formState.errors.root.message}</FormMessage>
        ) : null}
        {turnstileSiteKey ? (
          <div className="mt-6">
            <Turnstile
              ref={turnstileRef}
              siteKey={turnstileSiteKey}
              options={{
                language: i18n.language,
                size: "flexible",
              }}
              onSuccess={(token) => {
                setTurnstileToken(token);
              }}
              onError={() => {
                setTurnstileToken(null);
              }}
              onExpire={() => {
                setTurnstileToken(null);
                turnstileRef.current?.reset();
              }}
            />
          </div>
        ) : null}
        <div className="mt-6">
          <Button
            loading={form.formState.isSubmitting}
            disabled={isTurnstileEnabled && !turnstileToken}
            className="w-full"
            variant="primary"
            type="submit"
            size="xl"
          >
            <Trans i18nKey="continue" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
