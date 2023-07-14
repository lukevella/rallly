import { trpc } from "@rallly/backend";
import { ArrowRightIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import Link from "next/link";
import { Trans, useTranslation } from "next-i18next";
import React from "react";
import { useForm } from "react-hook-form";

import { usePostHog } from "@/utils/posthog";

import { requiredString, validEmail } from "../../utils/form-validation";
import { TextInput } from "../text-input";

const VerifyCode: React.FunctionComponent<{
  email: string;
  onSubmit: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onChange: () => void;
}> = ({ onChange, onSubmit, email, onResend }) => {
  const { register, handleSubmit, setError, formState } = useForm<{
    code: string;
  }>();
  const { t } = useTranslation();
  const [resendStatus, setResendStatus] = React.useState<
    "ok" | "busy" | "disabled"
  >("ok");

  const handleResend = async () => {
    setResendStatus("busy");
    try {
      await onResend();
      setResendStatus("disabled");
      setTimeout(() => {
        setResendStatus("ok");
      }, 1000 * 30);
    } catch {
      setResendStatus("ok");
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit(async ({ code }) => {
          try {
            await onSubmit(code);
          } catch {
            setError("code", {
              type: "not_found",
              message: t("wrongVerificationCode"),
            });
          }
        })}
      >
        <fieldset>
          <h1 className="mb-1">{t("verifyYourEmail")}</h1>
          <div className="mb-4 text-gray-500">
            {t("stepSummary", {
              current: 2,
              total: 2,
            })}
          </div>
          <p className="mb-4">
            <Trans
              t={t}
              i18nKey="verificationCodeSent"
              values={{ email }}
              components={{
                b: <strong className="whitespace-nowrap" />,
                a: (
                  <a
                    className="text-link"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onChange();
                    }}
                  />
                ),
              }}
            />
          </p>
          <TextInput
            autoFocus={true}
            proportions="lg"
            error={!!formState.errors.code}
            className="w-full"
            placeholder={t("verificationCodePlaceholder")}
            {...register("code", {
              validate: requiredString,
            })}
          />
          {formState.errors.code?.message ? (
            <p className="mb-4 mt-2 text-sm text-rose-500">
              {formState.errors.code.message}
            </p>
          ) : null}
          <p className="mt-2 text-sm text-gray-500">
            {t("verificationCodeHelp")}
          </p>
        </fieldset>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button
            loading={formState.isSubmitting || formState.isSubmitSuccessful}
            type="submit"
            size="lg"
            variant="primary"
          >
            {t("continue")}
          </Button>
          <Button
            size="lg"
            onClick={handleResend}
            loading={resendStatus === "busy"}
            disabled={resendStatus === "disabled"}
          >
            {t("resendVerificationCode")}
          </Button>
        </div>
      </form>
    </div>
  );
};

type RegisterFormData = {
  name: string;
  email: string;
};

export const RegisterForm: React.FunctionComponent<{
  onClickLogin?: React.MouseEventHandler;
  onRegistered?: () => void;
  defaultValues?: Partial<RegisterFormData>;
}> = ({ onClickLogin, onRegistered, defaultValues }) => {
  const { t } = useTranslation();
  const { register, handleSubmit, getValues, setError, formState } =
    useForm<RegisterFormData>({
      defaultValues,
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
          const res = await authenticateRegistration.mutateAsync({
            token,
            code,
          });

          if (!res.user) {
            throw new Error("Failed to authenticate user");
          }

          queryClient.invalidate();

          onRegistered?.();
          posthog?.identify(res.user.id, {
            email: res.user.email,
            name: res.user.name,
          });
          posthog?.capture("register");
        }}
        onResend={async () => {
          const values = getValues();
          await requestRegistration.mutateAsync({
            email: values.email,
            name: values.name,
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
                onClick={onClickLogin}
              />
            ),
          }}
        />
      </div>
    </form>
  );
};

export const LoginForm: React.FunctionComponent<{
  onClickRegister?: (
    e: React.MouseEvent<HTMLAnchorElement>,
    email: string,
  ) => void;
  onAuthenticated?: () => void;
}> = ({ onAuthenticated, onClickRegister }) => {
  const { t } = useTranslation();
  const { register, handleSubmit, getValues, formState, setError } = useForm<{
    email: string;
  }>();

  const requestLogin = trpc.auth.requestLogin.useMutation();
  const authenticateLogin = trpc.auth.authenticateLogin.useMutation();

  const queryClient = trpc.useContext();
  const [token, setToken] = React.useState<string>();
  const posthog = usePostHog();
  if (token) {
    return (
      <VerifyCode
        onSubmit={async (code) => {
          const res = await authenticateLogin.mutateAsync({
            code,
            token,
          });

          if (!res.user) {
            throw new Error("Failed to authenticate user");
          } else {
            onAuthenticated?.();
            queryClient.invalidate();
            posthog?.identify(res.user.id, {
              email: res.user.email,
              name: res.user.name,
            });
            posthog?.capture("login");
          }
        }}
        onResend={async () => {
          const values = getValues();
          const res = await requestLogin.mutateAsync({
            email: values.email,
          });

          if (res.ok) {
            setToken(res.token);
          } else {
            switch (res.reason) {
              case "emailNotAllowed":
                setError("email", {
                  message: t("emailNotAllowed"),
                });
                break;
              case "userNotFound":
                setError("email", {
                  message: t("userNotFound"),
                });
                break;
            }
          }
        }}
        onChange={() => setToken(undefined)}
        email={getValues("email")}
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        const res = await requestLogin.mutateAsync({
          email: data.email,
        });

        if (res.ok) {
          setToken(res.token);
        } else {
          switch (res.reason) {
            case "emailNotAllowed":
              setError("email", {
                message: t("emailNotAllowed"),
              });
              break;
            case "userNotFound":
              setError("email", {
                message: t("userNotFound"),
              });
              break;
          }
        }
      })}
    >
      <div className="mb-1 text-2xl font-bold">{t("login")}</div>
      <p className="mb-4 text-gray-500">
        {t("stepSummary", {
          current: 1,
          total: 2,
        })}
      </p>
      <fieldset className="mb-4">
        <label htmlFor="email" className="mb-1 text-gray-500">
          {t("email")}
        </label>
        <TextInput
          className="w-full"
          id="email"
          proportions="lg"
          autoFocus={true}
          error={!!formState.errors.email}
          disabled={formState.isSubmitting}
          placeholder={t("emailPlaceholder")}
          {...register("email", { validate: validEmail })}
        />
        {formState.errors.email?.message ? (
          <div className="mt-2 text-sm text-rose-500">
            {formState.errors.email.message}
          </div>
        ) : null}
      </fieldset>
      <div className="flex flex-col gap-2">
        <Button
          loading={formState.isSubmitting}
          type="submit"
          size="lg"
          variant="primary"
          className=""
        >
          {t("continue")}
        </Button>
        <Button size="lg" asChild>
          <Link
            href="/register"
            onClick={(e) => {
              onClickRegister?.(e, getValues("email"));
            }}
          >
            {t("createAnAccount")}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </form>
  );
};
