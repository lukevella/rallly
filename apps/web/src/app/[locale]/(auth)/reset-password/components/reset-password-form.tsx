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

import { Trans } from "@/components/trans";
import { authClient } from "@/lib/auth-client";

function useResetPasswordSchema() {
  const { t } = useTranslation();
  return React.useMemo(() => {
    return z
      .object({
        password: z.string().min(1, t("passwordRequired")),
        confirmPassword: z.string().min(1, t("passwordRequired")),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: t("passwordsMustMatch"),
        path: ["confirmPassword"],
      });
  }, [t]);
}

type ResetPasswordValues = z.infer<ReturnType<typeof useResetPasswordSchema>>;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetPasswordSchema = useResetPasswordSchema();
  const [error, setError] = React.useState<string | null>(null);
  const form = useForm<ResetPasswordValues>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    resolver: zodResolver(resetPasswordSchema),
  });
  const { handleSubmit, formState } = form;

  const token = searchParams?.get("token");

  if (!token) {
    return (
      <div className="rounded-lg border border-border bg-destructive/10 p-4 text-destructive text-sm">
        <p className="font-medium">
          <Trans i18nKey="resetPasswordInvalidToken" defaults="Invalid token" />
        </p>
        <p className="mt-2">
          <Trans
            i18nKey="resetPasswordInvalidTokenMessage"
            defaults="The password reset link is invalid or has expired. Please request a new one."
          />
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={handleSubmit(async ({ password }) => {
          setError(null);
          const res = await authClient.resetPassword({
            newPassword: password,
            token,
          });

          if (res.error) {
            setError(res.error.message);
            return;
          }

          router.push("/login");
        })}
      >
        {error ? (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-destructive text-sm">
            {error}
          </div>
        ) : null}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans i18nKey="newPassword" defaults="New password" />
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  size="lg"
                  type="password"
                  disabled={formState.isSubmitting}
                  autoFocus={true}
                  placeholder="••••••••"
                  error={!!formState.errors.password}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans i18nKey="confirmPassword" defaults="Confirm password" />
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  size="lg"
                  type="password"
                  disabled={formState.isSubmitting}
                  placeholder="••••••••"
                  error={!!formState.errors.confirmPassword}
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
            <Trans i18nKey="resetPassword" defaults="Reset password" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
