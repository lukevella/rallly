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
import { toast } from "@rallly/ui/sonner";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Trans } from "@/components/trans";
import { authClient } from "@/lib/auth-client";

function useChangePasswordSchema() {
  const { t } = useTranslation();
  return React.useMemo(() => {
    return z
      .object({
        currentPassword: z
          .string()
          .min(
            1,
            t("passwordRequired", { defaultValue: "Password is required" }),
          ),
        newPassword: z
          .string()
          .min(
            1,
            t("passwordRequired", { defaultValue: "Password is required" }),
          ),
        confirmPassword: z
          .string()
          .min(
            1,
            t("passwordRequired", { defaultValue: "Password is required" }),
          ),
      })
      .refine((data) => data.newPassword === data.confirmPassword, {
        message: t("passwordsMustMatch", {
          defaultValue: "Passwords must match",
        }),
        path: ["confirmPassword"],
      });
  }, [t]);
}

type ChangePasswordValues = z.infer<ReturnType<typeof useChangePasswordSchema>>;

export function ChangePasswordForm() {
  const changePasswordSchema = useChangePasswordSchema();
  const form = useForm<ChangePasswordValues>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    resolver: zodResolver(changePasswordSchema),
  });
  const { handleSubmit, formState } = form;
  const { t } = useTranslation();

  const onSubmit = async (data: ChangePasswordValues) => {
    const res = await authClient.changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      revokeOtherSessions: true,
    });

    if (res.error) {
      switch (res.error.code) {
        case "INVALID_PASSWORD":
          form.setError("currentPassword", {
            message: t("passwordIncorrect", {
              defaultValue: "Current password is incorrect",
            }),
          });
          break;
        default:
          form.setError("root", {
            message: res.error.message,
          });
          break;
      }
      return;
    }

    // Clear form and show success toast
    form.reset();
    toast.success(
      t("passwordChangedSuccess", {
        defaultValue: "Your password has been changed successfully",
      }),
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
        {form.formState.errors.root?.message && (
          <FormMessage>{form.formState.errors.root.message}</FormMessage>
        )}

        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans i18nKey="currentPassword" defaults="Current Password" />
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  disabled={formState.isSubmitting}
                  placeholder="••••••••"
                  error={!!formState.errors.currentPassword}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans i18nKey="newPassword" defaults="New Password" />
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  disabled={formState.isSubmitting}
                  placeholder="••••••••"
                  error={!!formState.errors.newPassword}
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
                <Trans i18nKey="confirmPassword" defaults="Confirm Password" />
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
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

        <div className="pt-2">
          <Button
            type="submit"
            loading={formState.isSubmitting}
            variant="primary"
          >
            <Trans i18nKey="changePassword" defaults="Change Password" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
