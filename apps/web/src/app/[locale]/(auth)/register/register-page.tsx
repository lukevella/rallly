"use client";
import { Button } from "@rallly/ui/button";
import { useParams, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { usePostHog } from "posthog-js/react";
import React from "react";
import { useForm } from "react-hook-form";

import { VerifyCode } from "@/components/auth/auth-forms";
import { TextInput } from "@/components/text-input";
import { useDayjs } from "@/utils/dayjs";
import { requiredString, validEmail } from "@/utils/form-validation";
import { trpc } from "@/utils/trpc/client";

type RegisterFormData = {
  name: string;
  email: string;
};

export const RegisterForm = () => {
  const { t } = useTranslation();
  const { timeZone } = useDayjs();
  const params = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const { register, handleSubmit, getValues, setError, formState } =
    useForm<RegisterFormData>({
      defaultValues: { email: "" },
    });

  const queryClient = trpc.useUtils();
  const requestRegistration = trpc.auth.requestRegistration.useMutation();
  const authenticateRegistration =
    trpc.auth.authenticateRegistration.useMutation();
  const [token, setToken] = React.useState<string>();
  const posthog = usePostHog();
  if (token) {
    return (
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
            timeZone,
            locale,
          });

          posthog?.capture("register");

          signIn("registration-token", {
            token,
            callbackUrl: searchParams?.get("callbackUrl") ?? undefined,
          });
        }}
        email={getValues("email")}
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        const res = await requestRegistration.mutateAsync({
          email: data.email,
          name: data.name,
        });

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
          }
        } else {
          setToken(res.token);
        }
      })}
    >
      <div className="mb-1 text-2xl font-bold">{t("createAnAccount")}</div>
      <p className="mb-4 text-gray-500">
        {t("stepSummary", {
          current: 1,
          total: 2,
        })}
      </p>
      <fieldset className="mb-4">
        <label htmlFor="name" className="mb-1 text-gray-500">
          {t("name")}
        </label>
        <TextInput
          id="name"
          className="w-full"
          proportions="lg"
          autoFocus={true}
          error={!!formState.errors.name}
          disabled={formState.isSubmitting}
          placeholder={t("namePlaceholder")}
          {...register("name", { validate: requiredString })}
        />
        {formState.errors.name?.message ? (
          <div className="mt-2 text-sm text-rose-500">
            {formState.errors.name.message}
          </div>
        ) : null}
      </fieldset>
      <fieldset className="mb-4">
        <label htmlFor="email" className="mb-1 text-gray-500">
          {t("email")}
        </label>
        <TextInput
          className="w-full"
          id="email"
          proportions="lg"
          error={!!formState.errors.email}
          disabled={formState.isSubmitting}
          placeholder={t("emailPlaceholder")}
          {...register("email", { validate: validEmail })}
        />
        {formState.errors.email?.message ? (
          <div className="mt-1 text-sm text-rose-500">
            {formState.errors.email.message}
          </div>
        ) : null}
      </fieldset>
      <Button
        loading={formState.isSubmitting}
        type="submit"
        variant="primary"
        size="lg"
      >
        {t("continue")}
      </Button>
    </form>
  );
};
