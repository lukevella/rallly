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
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Trans } from "@/components/trans";
import { authClient } from "@/lib/auth-client";

function useForgotPasswordSchema() {
  const { t } = useTranslation();
  return React.useMemo(() => {
    return z.object({
      email: z.email(t("validEmail")),
    });
  }, [t]);
}

type ForgotPasswordValues = z.infer<ReturnType<typeof useForgotPasswordSchema>>;

export function ForgotPasswordForm() {
  const forgotPasswordSchema = useForgotPasswordSchema();
  const [submitted, setSubmitted] = React.useState(false);
  const form = useForm<ForgotPasswordValues>({
    defaultValues: {
      email: "",
    },
    resolver: zodResolver(forgotPasswordSchema),
  });
  const { handleSubmit, formState } = form;
  const { t } = useTranslation();

  if (submitted) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-4 text-muted-foreground text-sm">
        <p className="font-medium text-foreground">
          <Trans
            i18nKey="forgotPasswordSubmitted"
            defaults="Check your email"
          />
        </p>
        <p className="mt-2">
          <Trans
            i18nKey="forgotPasswordSubmittedMessage"
            defaults="If an account exists with this email address, we've sent a password reset link to your inbox. Please check your email and follow the link to reset your password."
          />
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={handleSubmit(async ({ email }) => {
          const res = await authClient.requestPasswordReset({
            email,
            redirectTo: "/reset-password",
          });

          if (res.error) {
            form.setError("email", {
              message: res.error.message,
            });
            return;
          }

          setSubmitted(true);
        })}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("email")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  size="lg"
                  type="email"
                  disabled={formState.isSubmitting}
                  autoFocus={true}
                  placeholder={t("emailPlaceholder")}
                  error={!!formState.errors.email}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          <Button
            size="lg"
            loading={form.formState.isSubmitting}
            type="submit"
            className="w-full"
            variant="primary"
          >
            <Trans i18nKey="sendResetLink" defaults="Send reset link" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
