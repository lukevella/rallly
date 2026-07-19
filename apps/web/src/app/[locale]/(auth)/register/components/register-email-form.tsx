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
import * as z from "zod";
import { setVerificationEmail } from "@/app/[locale]/(auth)/login/actions";
import { Trans, useTranslation } from "@/i18n/client";
import { authClient } from "@/lib/auth-client";
import { validateRedirectUrl } from "@/lib/utils/redirect";

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
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
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
          // A "sign-in" OTP either creates an account on verification or
          // logs into an existing one, so registering with an email that is
          // already in use reveals nothing and still works.
          const res = await authClient.emailOtp.sendVerificationOtp({
            email,
            type: "sign-in",
          });

          if (res.error) {
            switch (res.error.code) {
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
                  message: res.error.message,
                });
                break;
            }
            return;
          }

          await setVerificationEmail(email);

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
        <div className="mt-6">
          <Button
            loading={form.formState.isSubmitting}
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
