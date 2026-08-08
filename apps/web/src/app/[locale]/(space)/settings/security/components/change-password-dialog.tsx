"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  useDialog,
} from "@rallly/ui/dialog";
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
import { PasswordStrengthMeter } from "@/features/auth/components/password-strength-meter";
import { usePasswordValidationSchema } from "@/features/auth/schema";
import { Trans, useTranslation } from "@/i18n/client";
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

export function ChangePasswordDialog({
  trigger,
}: {
  trigger: React.ReactElement;
}) {
  const dialog = useDialog();
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
    <Dialog
      {...dialog.dialogProps}
      onOpenChange={(open) => {
        dialog.dialogProps.onOpenChange(open);
        if (!open) {
          form.reset();
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
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
              dialog.dismiss();
              toast.success(
                t("passwordChangedSuccess", {
                  defaultValue: "Your password has been changed successfully",
                }),
              );
            })}
          >
            <DialogHeader>
              <DialogTitle>
                <Trans i18nKey="changePassword" defaults="Change password" />
              </DialogTitle>
              <DialogDescription>
                <Trans
                  i18nKey="changePasswordDescription"
                  defaults="Update your password to keep your account secure"
                />
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-4 py-4">
              {formState.errors.root?.message ? (
                <FormMessage>{formState.errors.root.message}</FormMessage>
              ) : null}

              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Trans
                        i18nKey="currentPassword"
                        defaults="Current password"
                      />
                    </FormLabel>
                    <FormControl>
                      <PasswordInput
                        {...field}
                        autoComplete="current-password"
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
                      <Trans i18nKey="newPassword" defaults="New password" />
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

            <DialogFooter>
              <DialogClose render={<Button />}>
                <Trans i18nKey="cancel" defaults="Cancel" />
              </DialogClose>
              <Button
                type="submit"
                variant="primary"
                loading={formState.isSubmitting}
              >
                <Trans i18nKey="changePassword" defaults="Change password" />
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
