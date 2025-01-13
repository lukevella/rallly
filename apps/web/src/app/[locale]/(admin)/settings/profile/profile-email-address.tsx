import { usePostHog } from "@rallly/posthog/client";
import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { Button } from "@rallly/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@rallly/ui/form";
import { useToast } from "@rallly/ui/hooks/use-toast";
import { Input } from "@rallly/ui/input";
import Cookies from "js-cookie";
import { InfoIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { trpc } from "@/trpc/client";

export const ProfileEmailAddress = () => {
  const { user, refresh } = useUser();
  const requestEmailChange = trpc.user.requestEmailChange.useMutation();
  const posthog = usePostHog();
  const form = useForm<{
    name: string;
    email: string;
  }>({
    defaultValues: {
      name: user.isGuest ? "" : user.name,
      email: user.email ?? "",
    },
  });
  const { t } = useTranslation("app");
  const { toast } = useToast();

  const [didRequestEmailChange, setDidRequestEmailChange] =
    React.useState(false);

  React.useEffect(() => {
    const success = Cookies.get("email-change-success");
    const error = Cookies.get("email-change-error");

    if (success) {
      posthog.capture("email change completed");
      toast({
        title: t("emailChangeSuccess", {
          defaultValue: "Email changed successfully",
        }),
        description: t("emailChangeSuccessDescription", {
          defaultValue: "Your email has been updated",
        }),
      });
    }

    if (error) {
      posthog.capture("email change failed", { error });
      toast({
        variant: "destructive",
        title: t("emailChangeFailed", {
          defaultValue: "Email change failed",
        }),
        description:
          error === "invalidToken"
            ? t("emailChangeInvalidToken", {
                defaultValue:
                  "The verification link is invalid or has expired. Please try again.",
              })
            : t("emailChangeError", {
                defaultValue: "An error occurred while changing your email",
              }),
      });
    }
  }, [posthog, refresh, t, toast]);

  const { handleSubmit, formState, reset } = form;
  return (
    <div className="grid gap-y-4">
      <Form {...form}>
        <form
          onSubmit={handleSubmit(async (data) => {
            reset(data);
            if (data.email !== user.email) {
              posthog.capture("email change requested");
              const res = await requestEmailChange.mutateAsync({
                email: data.email,
              });
              if (res.success === false) {
                if (res.reason === "emailAlreadyInUse") {
                  form.setError("email", {
                    message: t("emailAlreadyInUse", {
                      defaultValue:
                        "This email address is already associated with another account. Please use a different email address.",
                    }),
                  });
                }
              } else {
                setDidRequestEmailChange(true);
              }
            }
            await refresh();
          })}
        >
          <div className="flex flex-col gap-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans i18nKey="email" />
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {didRequestEmailChange ? (
              <Alert icon={InfoIcon}>
                <AlertTitle>
                  <Trans
                    i18nKey="emailChangeRequestSent"
                    defaults="Verify your new email address"
                  />
                </AlertTitle>
                <AlertDescription>
                  <Trans
                    i18nKey="emailChangeRequestSentDescription"
                    defaults="To complete the change, please check your email for a verification link."
                  />
                </AlertDescription>
              </Alert>
            ) : null}
            <div className="mt-4 flex">
              <Button
                loading={formState.isSubmitting}
                variant="primary"
                type="submit"
                disabled={!formState.isDirty}
              >
                <Trans i18nKey="save" />
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};
