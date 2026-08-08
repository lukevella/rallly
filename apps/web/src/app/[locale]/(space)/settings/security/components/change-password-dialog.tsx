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
import { Field, FieldError, FieldGroup, FieldLabel } from "@rallly/ui/field";
import { Form } from "@rallly/ui/form";
import { toast } from "@rallly/ui/sonner";
import React from "react";
import { Controller, useForm } from "react-hook-form";
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
  const currentPasswordId = React.useId();
  const newPasswordId = React.useId();
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
                      message:
                        res.error.message ??
                        t("changePasswordError", {
                          defaultValue:
                            "Something went wrong. Please try again.",
                        }),
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

            <FieldGroup className="py-4">
              {formState.errors.root?.message ? (
                <FieldError>{formState.errors.root.message}</FieldError>
              ) : null}

              <Controller
                control={form.control}
                name="currentPassword"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={currentPasswordId}>
                      <Trans
                        i18nKey="currentPassword"
                        defaults="Current password"
                      />
                    </FieldLabel>
                    <PasswordInput
                      {...field}
                      id={currentPasswordId}
                      autoComplete="current-password"
                      disabled={formState.isSubmitting}
                      placeholder="••••••••"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="newPassword"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={newPasswordId}>
                      <Trans i18nKey="newPassword" defaults="New password" />
                    </FieldLabel>
                    <PasswordInput
                      {...field}
                      id={newPasswordId}
                      autoComplete="new-password"
                      disabled={formState.isSubmitting}
                      placeholder="••••••••"
                      aria-invalid={fieldState.invalid}
                    />
                    <PasswordStrengthMeter
                      password={field.value}
                      className="mt-2"
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </FieldGroup>

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
