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
import { PasswordInput } from "@rallly/ui/password-input";
import { toast } from "@rallly/ui/sonner";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";
import { Trans } from "@/i18n/client";
import { PasswordStrengthMeter } from "@/features/password/components/password-strength-meter";
import { usePasswordValidationSchema } from "@/features/password/schema";
import { authClient } from "@/lib/auth-client";

function useChangePasswordSchema() {
  const { t } = useTranslation();
  const passwordValidation = usePasswordValidationSchema();

  return z
    .object({
      currentPassword: z
        .string()
        .min(
          1,
          t("passwordRequired", { defaultValue: "Password is required" }),
        ),
      newPassword: passwordValidation,
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: t("passwordsMustBeDifferent", {
        defaultValue: "New password must be different from current password",
      }),
      path: ["newPassword"],
    });
}

export function ChangePasswordForm() {
  const changePasswordSchema = useChangePasswordSchema();
  const form = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
    resolver: zodResolver(changePasswordSchema),
  });
  const { handleSubmit, formState } = form;
  const { t } = useTranslation();

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(async (data) => {
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

          form.reset();
          toast.success(
            t("passwordChangedSuccess", {
              defaultValue: "Your password has been changed successfully",
            }),
          );
        })}
      >
        {form.formState.errors.root?.message && (
          <FormMessage>{form.formState.errors.root.message}</FormMessage>
        )}

        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Trans
                    i18nKey="currentPassword"
                    defaults="Current Password"
                  />
                </FormLabel>
                <FormControl>
                  <PasswordInput
                    {...field}
                    disabled={formState.isSubmitting}
                    placeholder="••••••••"
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
                  <PasswordInput
                    {...field}
                    disabled={formState.isSubmitting}
                    placeholder="••••••••"
                  />
                </FormControl>
                <PasswordStrengthMeter
                  password={field.value}
                  className="mt-2"
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mt-6">
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
