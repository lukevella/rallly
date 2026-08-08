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
import { setPasswordAction } from "@/features/auth/actions";
import { PasswordStrengthMeter } from "@/features/auth/components/password-strength-meter";
import { usePasswordValidationSchema } from "@/features/auth/schema";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

export function SetupPasswordDialog({
  trigger,
}: {
  trigger: React.ReactElement;
}) {
  const dialog = useDialog();
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
      dialog.dismiss();
      toast.success(
        t("passwordSetSuccess", {
          defaultValue: "Your password has been set successfully",
        }),
      );
    },
  });

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
            onSubmit={form.handleSubmit(async (data) => {
              await setPassword.executeAsync({ password: data.password });
            })}
          >
            <DialogHeader>
              <DialogTitle>
                <Trans i18nKey="setPasswordTitle" defaults="Set password" />
              </DialogTitle>
              <DialogDescription>
                <Trans
                  i18nKey="setPasswordSectionDescription"
                  defaults="Your account doesn't have a password yet. Set one to sign in with your email address."
                />
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-4 py-4">
              <FormField
                control={form.control}
                name="password"
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
                <Trans i18nKey="setPassword" defaults="Set password" />
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
