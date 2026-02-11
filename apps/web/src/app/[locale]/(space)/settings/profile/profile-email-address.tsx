"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { Input } from "@rallly/ui/input";
import { CheckCircleIcon, InfoIcon, XIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";
import { Trans } from "@/i18n/client";
import { trpc } from "@/trpc/client";

const emailChangeFormData = z.object({
  email: z.email(),
});

export const ProfileEmailAddress = ({ email }: { email: string }) => {
  const requestEmailChange = trpc.user.requestEmailChange.useMutation();
  const form = useForm({
    defaultValues: {
      email,
    },
    resolver: zodResolver(emailChangeFormData),
  });
  const { t } = useTranslation("app");

  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const didEmailChange = searchParams.get("emailChanged") === "true";

  const [didRequestEmailChange, setDidRequestEmailChange] =
    React.useState(false);

  const { handleSubmit, formState, reset } = form;

  return (
    <div className="grid gap-y-4">
      <Form {...form}>
        <form
          onSubmit={handleSubmit(async (data) => {
            if (data.email !== email) {
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
                reset(data);
              }
            }
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
                    <Input disabled={form.formState.isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {didRequestEmailChange ? (
              <Alert>
                <InfoIcon />
                <AlertTitle>
                  <Trans
                    i18nKey="emailChangeRequestSent"
                    defaults="Verify your new email address"
                  />
                </AlertTitle>
                <AlertDescription>
                  <p>
                    <Trans
                      i18nKey="emailChangeRequestSentDescription"
                      defaults="To complete the change, please check your email for a verification link."
                    />
                  </p>
                </AlertDescription>
              </Alert>
            ) : null}
            {didEmailChange ? (
              <Alert variant="success">
                <CheckCircleIcon />
                <AlertDescription>
                  <p>
                    <Trans
                      i18nKey="emailChangeSuccess"
                      defaults="Email changed successfully"
                    />
                  </p>
                </AlertDescription>
              </Alert>
            ) : null}
            {error === "invalidToken" ? (
              <Alert variant="warning">
                <XIcon />
                <AlertDescription>
                  <p>
                    <Trans
                      i18nKey="emailChangeInvalidToken"
                      defaults="The verification link is invalid or has expired. Please try again."
                    />
                  </p>
                </AlertDescription>
              </Alert>
            ) : null}
            {error === "invalidUserId" ? (
              <Alert variant="warning">
                <XIcon />
                <AlertDescription>
                  <p>
                    <Trans
                      i18nKey="emailChangeInvalidUserId"
                      defaults="Please login with the same email address as the one you used to request the change."
                    />
                  </p>
                </AlertDescription>
              </Alert>
            ) : null}
            <div className="mt-4 flex">
              <Button
                loading={formState.isSubmitting}
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
