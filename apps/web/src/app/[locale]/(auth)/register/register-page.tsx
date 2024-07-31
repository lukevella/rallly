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
import { TRPCClientError } from "@trpc/client";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { usePostHog } from "posthog-js/react";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { VerifyCode } from "@/components/auth/auth-forms";
import { AuthCard } from "@/components/auth/auth-layout";
import { Trans } from "@/components/trans";
import { useDayjs } from "@/utils/dayjs";
import { trpc } from "@/utils/trpc/client";

const registerFormSchema = z.object({
  name: z.string().nonempty().max(100),
  email: z.string().email(),
});

type RegisterFormData = z.infer<typeof registerFormSchema>;

export const RegisterForm = () => {
  const { t } = useTranslation();
  const { timeZone } = useDayjs();
  const params = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const form = useForm<RegisterFormData>({
    defaultValues: { email: "", name: "" },
    resolver: zodResolver(registerFormSchema),
  });

  const { handleSubmit, control, getValues, setError, formState } = form;
  const queryClient = trpc.useUtils();
  const requestRegistration = trpc.auth.requestRegistration.useMutation();
  const authenticateRegistration =
    trpc.auth.authenticateRegistration.useMutation();
  const [token, setToken] = React.useState<string>();
  const posthog = usePostHog();
  if (token) {
    return (
      <AuthCard>
        <VerifyCode
          onSubmit={async (code) => {
            // get user's time zone
            const locale = params?.locale ?? "en";
            const res = await authenticateRegistration.mutateAsync({
              token,
              timeZone,
              locale,
              code,
            });

            if (!res.user) {
              throw new Error("Failed to authenticate user");
            }

            queryClient.invalidate();

            posthog?.identify(res.user.id, {
              email: res.user.email,
              name: res.user.name,
            });

            signIn("registration-token", {
              token,
              callbackUrl: searchParams?.get("callbackUrl") ?? undefined,
            });
          }}
          email={getValues("email")}
        />
      </AuthCard>
    );
  }

  return (
    <div>
      <AuthCard>
        <Form {...form}>
          <form
            onSubmit={handleSubmit(async (data) => {
              try {
                await requestRegistration.mutateAsync(
                  {
                    email: data.email,
                    name: data.name,
                  },
                  {
                    onSuccess: (res) => {
                      if (!res.ok) {
                        switch (res.reason) {
                          case "userAlreadyExists":
                            setError("email", {
                              message: t("userAlreadyExists"),
                            });
                            break;
                          case "emailNotAllowed":
                            setError("email", {
                              message: t("emailNotAllowed"),
                            });
                            break;
                        }
                      } else {
                        setToken(res.token);
                      }
                    },
                  },
                );
              } catch (error) {
                if (error instanceof TRPCClientError) {
                  setError("root", {
                    message: error.shape.message,
                  });
                }
              }
            })}
          >
            <div className="mb-1 text-2xl font-bold">
              {t("createAnAccount")}
            </div>
            <p className="mb-6 text-gray-500">
              {t("stepSummary", {
                current: 1,
                total: 2,
              })}
            </p>
            <div className="space-y-4">
              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="name">{t("name")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id="name"
                        size="lg"
                        autoFocus={true}
                        error={!!formState.errors.name}
                        placeholder={t("namePlaceholder")}
                        disabled={formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="email">{t("email")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id="email"
                        size="lg"
                        error={!!formState.errors.email}
                        placeholder={t("emailPlaceholder")}
                        disabled={formState.isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="mt-6">
              <Button
                loading={formState.isSubmitting}
                type="submit"
                variant="primary"
                size="lg"
              >
                {t("continue")}
              </Button>
            </div>
            {formState.errors.root ? (
              <FormMessage className="mt-6">
                {formState.errors.root.message}
              </FormMessage>
            ) : null}
          </form>
        </Form>
      </AuthCard>
      {!form.formState.isSubmitSuccessful ? (
        <div className="mt-4 pt-4 text-center text-gray-500 sm:text-base">
          <Trans
            i18nKey="alreadyRegistered"
            components={{
              a: <Link href="/login" className="text-link" />,
            }}
          />
        </div>
      ) : null}
    </div>
  );
};
