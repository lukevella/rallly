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
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { setVerificationEmail } from "@/app/[locale]/(auth)/login/actions";
import { Trans, useTranslation } from "@/i18n/client";
import { authClient } from "@/lib/auth-client";
import { useFeatureFlag } from "@/lib/feature-flags/client";
import { validateRedirectUrl } from "@/lib/utils/redirect";
import { trpc } from "@/trpc/client";

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

function useLoginWithEmailSchema() {
  const { t } = useTranslation();
  return React.useMemo(() => {
    return z.object({
      identifier: z.email(t("validEmail")),
      password: z.string().optional(),
    });
  }, [t]);
}

export function LoginWithEmailForm({
  isRegistrationEnabled,
}: {
  isRegistrationEnabled: boolean;
}) {
  const isCaptchaEnabled = useFeatureFlag("captcha");
  const isTurnstileEnabled = isCaptchaEnabled && !!turnstileSiteKey;
  const router = useRouter();
  const loginWithEmailSchema = useLoginWithEmailSchema();
  const searchParams = useSearchParams();
  const [showPasswordField, setShowPasswordField] = React.useState(false);
  const [showCaptcha, setShowCaptcha] = React.useState(false);
  const turnstileRef = React.useRef<TurnstileInstance>(null);
  const [turnstileToken, setTurnstileToken] = React.useState<string | null>(
    null,
  );
  const form = useForm({
    defaultValues: {
      identifier: "",
      password: "",
    },
    resolver: zodResolver(loginWithEmailSchema),
  });
  const { handleSubmit, formState } = form;
  const { t, i18n } = useTranslation();

  const getLoginMethod = trpc.auth.getLoginMethod.useMutation();
  const isPasswordLogin = showPasswordField && !!form.watch("password");

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={handleSubmit(async ({ identifier, password }) => {
          const validatedRedirectTo = validateRedirectUrl(
            searchParams?.get("redirectTo"),
          );

          if (password) {
            const res = await authClient.signIn.email({
              email: identifier,
              password,
            });

            if (res.error) {
              switch (res.error.code) {
                case "INVALID_EMAIL_OR_PASSWORD":
                  form.setError("password", {
                    message: t("passwordOrEmailIncorrect", {
                      defaultValue: "Invalid email or password",
                    }),
                  });
                  break;
                case "BANNED_USER":
                  form.setError("identifier", {
                    message: t("authErrorsUserBanned", {
                      defaultValue:
                        "This account has been banned. Please contact support if you believe this is an error.",
                    }),
                  });
                  break;
                default:
                  form.setError("password", {
                    message: res.error.message,
                  });
                  break;
              }
              return;
            }

            window.location.href = validatedRedirectTo ?? "/";

            return;
          }

          if (!showPasswordField) {
            const res = await getLoginMethod.mutateAsync({
              email: identifier,
            });

            if (res.method === "credential") {
              // show password field
              setShowPasswordField(true);
              return;
            }
          }

          // The OTP send is captcha-gated. Reveal the widget on the first
          // attempt and wait for a token before sending.
          if (isTurnstileEnabled && !turnstileToken) {
            setShowCaptcha(true);
            return;
          }

          try {
            // When registration is enabled a "sign-in" OTP either signs
            // into an existing account or creates one on verification, so
            // known and unknown emails behave identically. When it's
            // disabled, "email-verification" only reaches existing users.
            const res = await authClient.emailOtp.sendVerificationOtp({
              email: identifier,
              type: isRegistrationEnabled ? "sign-in" : "email-verification",
              fetchOptions: turnstileToken
                ? {
                    headers: {
                      "x-captcha-response": turnstileToken,
                    },
                  }
                : undefined,
            });

            if (res.error) {
              switch (res.error.code) {
                case "MISSING_RESPONSE":
                case "VERIFICATION_FAILED":
                  form.setError("root", {
                    message: t("captchaFailed", {
                      defaultValue: "Verification failed. Please try again.",
                    }),
                  });
                  break;
                case "EMAIL_BLOCKED":
                  form.setError("identifier", {
                    message: t("authErrorsEmailBlocked"),
                  });
                  break;
                case "TEMPORARY_EMAIL_NOT_ALLOWED":
                  form.setError("identifier", {
                    message: t("temporaryEmailNotAllowed"),
                  });
                  break;
                case "BANNED_USER":
                  form.setError("identifier", {
                    message: t("authErrorsUserBanned", {
                      defaultValue:
                        "This account has been banned. Please contact support if you believe this is an error.",
                    }),
                  });
                  break;
                default:
                  form.setError("identifier", {
                    message: res.error.message,
                  });
                  break;
              }
              return;
            }

            await setVerificationEmail(identifier);

            router.push(
              `/login/verify${
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
        <FormField
          control={form.control}
          name="identifier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("email")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  large
                  type="text"
                  autoComplete="username"
                  disabled={formState.isSubmitting}
                  autoFocus={true}
                  placeholder={t("emailPlaceholder")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {showPasswordField ? (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>
                    <Trans i18nKey="password" defaults="Password" />
                    <span className="ml-1 text-muted-foreground text-xs">
                      <Trans i18nKey="optionalLabel" defaults="(Optional)" />
                    </span>
                  </FormLabel>
                  <Link
                    href={`/forgot-password?email=${encodeURIComponent(
                      form.watch("identifier"),
                    )}`}
                    className="text-muted-foreground text-sm hover:underline"
                  >
                    <Trans
                      i18nKey="forgotPassword"
                      defaults="Forgot password?"
                    />
                  </Link>
                </div>

                <FormControl>
                  <Input
                    autoFocus={true}
                    large
                    type="password"
                    autoComplete="current-password"
                    disabled={form.formState.isSubmitting}
                    placeholder="••••••••"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
        {form.formState.errors.root?.message ? (
          <FormMessage>{form.formState.errors.root.message}</FormMessage>
        ) : null}
        {showCaptcha && isTurnstileEnabled && turnstileSiteKey ? (
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
        ) : null}
        <div>
          <Button
            size="xl"
            loading={form.formState.isSubmitting}
            disabled={showCaptcha && !isPasswordLogin && !turnstileToken}
            type="submit"
            className="w-full"
            variant="primary"
          >
            {showPasswordField ? (
              isPasswordLogin ? (
                <Trans
                  i18nKey="loginWithPassword"
                  defaults="Login with password"
                />
              ) : (
                <Trans i18nKey="loginWithEmail" defaults="Login with email" />
              )
            ) : (
              <Trans
                i18nKey="continueWithEmail"
                defaults="Continue with email"
              />
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
