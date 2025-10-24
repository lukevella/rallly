"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@rallly/ui/alert";
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
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Trans } from "@/components/trans";
import { PasswordStrengthMeter } from "@/features/password/components/password-strength-meter";
import { usePasswordValidationSchema } from "@/features/password/schema";
import { authClient } from "@/lib/auth-client";

function useResetPasswordSchema() {
  const passwordValidation = usePasswordValidationSchema();
  return z.object({
    password: passwordValidation,
  });
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetPasswordSchema = useResetPasswordSchema();
  const form = useForm({
    defaultValues: {
      password: "",
    },
    resolver: zodResolver(resetPasswordSchema),
  });
  const { handleSubmit, formState } = form;

  const token = searchParams?.get("token");

  if (!token) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          <p>
            <Trans
              i18nKey="resetPasswordInvalidTokenMessage"
              defaults="The password reset link is invalid or has expired. Please request a new one."
            />
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(async ({ password }) => {
          const res = await authClient.resetPassword({
            newPassword: password,
            token,
          });

          if (res.error) {
            form.setError("root", {
              message: res.error.message,
            });
            return;
          }

          // Check if this came from password setup (redirectTo contains settings)
          const redirectTo = searchParams?.get("redirectTo");
          if (redirectTo?.includes("/settings/security")) {
            // For password setup, redirect back to settings
            router.push(redirectTo);
          } else {
            // For password reset, redirect to login
            router.push("/login");
          }
        })}
      >
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Trans i18nKey="password" defaults="Password" />
                </FormLabel>
                <FormControl>
                  <PasswordInput
                    {...field}
                    size="lg"
                    disabled={formState.isSubmitting}
                    autoFocus={true}
                    placeholder="••••••••"
                    error={!!formState.errors.password}
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
          {form.formState.errors.root?.message ? (
            <FormMessage>{form.formState.errors.root.message}</FormMessage>
          ) : null}
        </div>
        <div className="mt-6">
          <Button
            size="lg"
            loading={form.formState.isSubmitting}
            type="submit"
            className="w-full"
            variant="primary"
          >
            <Trans i18nKey="resetPasswordButton" defaults="Reset password" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
