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
import { toast } from "@rallly/ui/sonner";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { PasswordInput } from "@/components/password-input";
import { setPasswordAction } from "@/features/auth/actions";
import { PasswordStrengthMeter } from "@/features/auth/components/password-strength-meter";
import { usePasswordValidationSchema } from "@/features/auth/schema";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export function SetupPasswordForm() {
  const { t } = useTranslation();
  const passwordValidation = usePasswordValidationSchema();
  const form = useForm({
    defaultValues: { password: "" },
    resolver: zodResolver(z.object({ password: passwordValidation })),
  });
  const { formState } = form;

  const setPassword = useSafeAction(setPasswordAction, {
    onSuccess: () => {
      form.reset();
      toast.success(
        t("passwordSetSuccess", {
          defaultValue: "Your password has been set successfully",
        }),
      );
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          await setPassword.executeAsync({ password: data.password });
        })}
      >
        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Trans i18nKey="newPassword" defaults="New Password" />
                </FormLabel>
                <FormControl>
                  <PasswordInput
                    {...field}
                    autoComplete="new-password"
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
            <Trans i18nKey="setPassword" defaults="Set Password" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
