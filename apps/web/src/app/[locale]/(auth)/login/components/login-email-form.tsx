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
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import {
  getLoginMethod,
  setVerificationEmail,
} from "@/app/[locale]/(auth)/login/actions";
import { Trans } from "@/components/trans";
import { authClient } from "@/lib/auth-client";
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

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={handleSubmit(async ({ identifier, password }) => {
          if (password) {
            const res = await authClient.signIn.email({
              email: identifier,
              password,
            });

            if (res.error) {
              form.setError("password", {
                message: res.error.message,
              });
              return;
            }
            console.log({ res });

            router.push("/");

            return;
          } else {
            if (!showPasswordField) {
              const { data: loginMethod } = await getLoginMethod(identifier);

              if (loginMethod === "credential") {
                // show password field
                setShowPasswordField(true);
                return;
              }
            }

            const res = await authClient.emailOtp.sendVerificationOtp({
              email: identifier,
              type: "sign-in",
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
            const validatedRedirectTo = validateRedirectUrl(
              searchParams?.get("redirectTo"),
            );
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
                <FormLabel>
                  <Trans i18nKey="password" defaults="Password" />
                </FormLabel>
                <FormControl>
                  <Input
                    autoFocus={true}
                    size="lg"
                    type="password"
                    disabled={form.formState.isSubmitting}
                    placeholder="************"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        ) : null}
        <div>
          <Button
            size="lg"
            loading={form.formState.isSubmitting}
            type="submit"
            className="w-full"
            variant="primary"
          >
            <Trans
              i18nKey="continueWith"
              defaults="Continue with {provider}"
              values={{ provider: t("email") }}
            />
          </Button>
        </div>
      </form>
    </Form>
  );
}
