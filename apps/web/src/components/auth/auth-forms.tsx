"use client";
import { Button } from "@rallly/ui/button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ClientSafeProvider,
  LiteralUnion,
  getProviders,
  signIn,
  useSession,
} from "next-auth/react";
import { Trans, useTranslation } from "next-i18next";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { createGlobalState } from "react-use";

import { usePostHog } from "@/utils/posthog";
import { trpc } from "@/utils/trpc/client";

import { requiredString, validEmail } from "../../utils/form-validation";
import { TextInput } from "../text-input";

import { BuiltInProviderType } from "next-auth/providers/index";

export const useDefaultEmail = createGlobalState("");

const verifyCode = async (options: { email: string; token: string }) => {
  const url = `${
    window.location.origin
  }/api/auth/callback/email?email=${encodeURIComponent(options.email)}&token=${
    options.token
  }`;

  const res = await fetch(url);

  return !res.url.includes("auth/error");
};

export const VerifyCode: React.FunctionComponent<{
  email: string;
  onSubmit: (code: string) => Promise<void>;
  onChange: () => void;
}> = ({ onChange, onSubmit, email }) => {
  const { register, handleSubmit, setError, formState } = useForm<{
    code: string;
  }>();
  const { t } = useTranslation();

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
        </div>
      </form>
    </div>
  );
};

export const LoginForm: React.FunctionComponent<{
  onClickRegister?: (
    e: React.MouseEvent<HTMLAnchorElement>,
    email: string,
  ) => void;
}> = ({ onClickRegister }) => {
  const { t } = useTranslation();
  const [defaultEmail, setDefaultEmail] = useDefaultEmail();

  const { register, handleSubmit, getValues, formState, setError } = useForm<{
    email: string;
  }>({
    defaultValues: { email: defaultEmail },
  });

  const session = useSession();
  const queryClient = trpc.useUtils();
  const [email, setEmail] = React.useState<string>();
  const posthog = usePostHog();
  const router = useRouter();
  const callbackUrl = (useSearchParams()?.get("callbackUrl") as string) ?? "/";

  const [providers, setProviders] = useState<Record<
    LiteralUnion<BuiltInProviderType, string>,
    ClientSafeProvider
  > | null>(null);

  // Fetch Next Auth providers list to display "Sign in with" buttons
  useEffect(() => {
    (async () => {
      const res = (await getProviders()) as Record<
        LiteralUnion<BuiltInProviderType>,
        ClientSafeProvider
      >;
      setProviders(res);
    })();
  }, []);

  const sendVerificationEmail = (email: string) => {
    return signIn("email", {
      redirect: false,
      email,
      callbackUrl,
    });
  };
  if (email) {
    return (
      <VerifyCode
        onSubmit={async (code) => {
          const success = await verifyCode({
            email,
            token: code,
          });
          if (!success) {
            throw new Error("Failed to authenticate user");
          } else {
            queryClient.invalidate();
            const s = await session.update();
            if (s?.user) {
              posthog?.identify(s.user.id, {
                email: s.user.email,
                name: s.user.name,
              });
            }
            posthog?.capture("login", {
              method: "verification-code",
            });
            router.push(callbackUrl);
          }
        }}
        onChange={() => setEmail(undefined)}
        email={getValues("email")}
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit(async ({ email }) => {
        const res = await sendVerificationEmail(email);

        if (res?.error) {
          setError("email", {
            message: t("userNotFound"),
          });
        } else {
          setEmail(email);
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
              React.startTransition(() => {
                setDefaultEmail(getValues("email"));
                onClickRegister?.(e, getValues("email"));
              });
            }}
          >
            {t("createAnAccount")}
          </Link>
        </Button>

        {providers ? <hr className="border-t border-grey-500 my-2" /> : null}

        {providers &&
          Object.values(providers).map((provider) =>
            provider.type === "oauth" ? (
              <Button
                size="lg"
                asChild
                onClick={() => signIn(provider.id)}
                key={provider.name}
              >
                <Link href="">
                  {t("loginWith")} {provider.name}
                </Link>
              </Button>
            ) : null,
          )}
      </div>
    </form>
  );
};
