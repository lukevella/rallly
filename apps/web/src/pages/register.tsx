import { trpc } from "@rallly/backend";
import { Button } from "@rallly/ui/button";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import { Trans, useTranslation } from "next-i18next";
import { usePostHog } from "posthog-js/react";
import React from "react";
import { useForm } from "react-hook-form";

import { useDefaultEmail, VerifyCode } from "@/components/auth/auth-forms";
import { StandardLayout } from "@/components/layouts/standard-layout";
import { TextInput } from "@/components/text-input";
import { NextPageWithLayout } from "@/types";
import { useDayjs } from "@/utils/dayjs";
import { requiredString, validEmail } from "@/utils/form-validation";

import { AuthLayout } from "../components/auth/auth-layout";
import { getStaticTranslations } from "../utils/with-page-translations";

type RegisterFormData = {
  name: string;
  email: string;
};

export const RegisterForm: React.FunctionComponent<{
  onClickLogin?: React.MouseEventHandler;
}> = ({ onClickLogin }) => {
  const [defaultEmail, setDefaultEmail] = useDefaultEmail();
  const { t } = useTranslation();
  const { timeZone } = useDayjs();
  const router = useRouter();
  const { register, handleSubmit, getValues, setError, formState } =
    useForm<RegisterFormData>({
      defaultValues: { email: defaultEmail },
    });

  const queryClient = trpc.useContext();
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
          const locale = router.locale;
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
            callbackUrl: router.query.callbackUrl as string,
          });
        }}
        onChange={() => setToken(undefined)}
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
      <div className="mt-4 border-t pt-4 text-gray-500 sm:text-base">
        <Trans
          t={t}
          i18nKey="alreadyRegistered"
          components={{
            a: (
              <Link
                href="/login"
                className="text-link"
                onClick={(e) => {
                  setDefaultEmail(getValues("email"));
                  onClickLogin?.(e);
                }}
              />
            ),
          }}
        />
      </div>
    </form>
  );
};

const Page: NextPageWithLayout = () => {
  const { t } = useTranslation();

  return (
    <AuthLayout>
      <Head>
        <title>{t("register")}</title>
      </Head>
      <RegisterForm />
    </AuthLayout>
  );
};

Page.getLayout = (page) => {
  return <StandardLayout hideNav={true}>{page}</StandardLayout>;
};

export const getStaticProps = getStaticTranslations;

export default Page;
