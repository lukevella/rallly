"use client";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogProps,
  DialogTitle,
} from "@rallly/ui/dialog";
import { Form, FormField, FormItem, FormMessage } from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { signOut } from "next-auth/react";
import { useForm } from "react-hook-form";

import { useTranslation } from "@/app/i18n/client";
import { Trans } from "@/components/trans";
import { usePostHog } from "@/utils/posthog";
import { trpc } from "@/utils/trpc/client";

export function DeleteAccountDialog({
  email,
  children,
  ...rest
}: DialogProps & {
  email: string;
}) {
  const form = useForm<{ email: string }>({
    defaultValues: {
      email: "",
    },
  });
  const { t } = useTranslation("app");
  const trpcUtils = trpc.useUtils();
  const posthog = usePostHog();
  const deleteAccount = trpc.user.delete.useMutation({
    onSuccess() {
      posthog?.capture("delete account");
      trpcUtils.invalidate();
      signOut({
        callbackUrl: "/login",
      });
    },
  });

  return (
    <Form {...form}>
      <Dialog {...rest}>
        {children}
        <DialogContent>
          <form
            method="POST"
            action="/auth/logout"
            onSubmit={form.handleSubmit(async () => {
              await deleteAccount.mutateAsync();
            })}
          >
            <DialogHeader>
              <DialogTitle>
                <Trans
                  i18nKey="deleteAccountDialogTitle"
                  defaults="Delete Account"
                />
              </DialogTitle>
              <DialogDescription>
                <Trans
                  i18nKey="deleteAccountDialogDescription"
                  defaults="Are you sure you want to delete your account?"
                />
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm">
                <Trans
                  i18nKey="deleteAccountInstruction"
                  defaults="Please confirm your email address to delete your account"
                />
              </p>
              <FormField
                control={form.control}
                name="email"
                rules={{
                  validate: (value) => {
                    if (value !== email) {
                      return t("emailMismatch", {
                        defaultValue: "Email does not match the account email",
                      });
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <Input
                      error={!!form.formState.errors.email}
                      placeholder={email}
                      {...field}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button>
                  <Trans i18nKey="cancel" defaults="Cancel" />
                </Button>
              </DialogClose>
              <Button
                type="submit"
                loading={deleteAccount.isLoading}
                variant="destructive"
              >
                <Trans i18nKey="deleteAccount" defaults="Delete Account" />
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
