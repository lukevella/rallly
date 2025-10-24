"use client";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useTranslation } from "react-i18next";
import { z } from "zod";

import {
  getLoginMethodAction,
  setVerificationEmail,
} from "@/app/[locale]/(auth)/login/actions";
import { Trans } from "@/components/trans";
import { authClient } from "@/lib/auth-client";
import { useSafeAction } from "@/lib/safe-action/client";
import { validateRedirectUrl } from "@/utils/redirect";

function useLoginWithEmailSchema() {
  const { t } = useTranslation();
  return React.useMemo(() => {
    return z.object({
      identifier: z.email(t("validEmail")),
      password: z.string().optional(),
    });
  }, [t]);
}

type LoginWithEmailValues = z.infer<ReturnType<typeof useLoginWithEmailSchema>>;

export function LoginWithEmailForm() {
  const router = useRouter();
  const loginWithEmailSchema = useLoginWithEmailSchema();
  const searchParams = useSearchParams();
  const [showPasswordField, setShowPasswordField] = React.useState(false);
  const form = useForm<LoginWithEmailValues>({
    defaultValues: {
      identifier: "",
      password: "",
    },
    resolver: zodResolver(loginWithEmailSchema),
  });
  const { handleSubmit, formState } = form;
  const { t } = useTranslation();

  const { executeAsync: getLoginMethod } = useSafeAction(getLoginMethodAction);

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
                default:
                  form.setError("password", {
                    message: res.error.message,
                  });
                  break;
              }
              return;
            }

            router.push(validatedRedirectTo ?? "/");

            return;
          } else {
            if (!showPasswordField) {
              const res = await getLoginMethod({
                email: identifier,
              });

              if (res.data?.method === "credential") {
                // show password field
                setShowPasswordField(true);
                return;
              }
            }

            const res = await authClient.emailOtp.sendVerificationOtp({
              email: identifier,
              type: "email-verification",
            });

            if (res.error) {
              switch (res.error.code) {
                case "USER_NOT_FOUND":
                  form.setError("identifier", {
                    message: t("userNotFound"),
                  });
                  break;
                case "EMAIL_BLOCKED":
                  form.setError("identifier", {
                    message: t("authErrorsEmailBlocked"),
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
            // redirect to verify page with redirectTo

            router.push(
              `/login/verify${
                validatedRedirectTo
                  ? `?redirectTo=${encodeURIComponent(validatedRedirectTo)}`
                  : ""
              }`,
            );
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
                  size="lg"
                  type="text"
                  disabled={formState.isSubmitting}
                  autoFocus={true}
                  placeholder={t("emailPlaceholder")}
                  error={!!formState.errors.identifier}
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
                    size="lg"
                    type="password"
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
        <div>
          <Button
            size="lg"
            loading={form.formState.isSubmitting}
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
