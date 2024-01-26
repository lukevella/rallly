"use client";
import { Button } from "@rallly/ui/button";
import { useQuery } from "@tanstack/react-query";
import { UserIcon } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { getProviders, signIn, useSession } from "next-auth/react";
import { usePostHog } from "posthog-js/react";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { trpc } from "@/app/providers";
import { VerifyCode, verifyCode } from "@/components/auth/auth-forms";
import { Spinner } from "@/components/spinner";
import { TextInput } from "@/components/text-input";
import { isSelfHosted } from "@/utils/constants";
import { validEmail } from "@/utils/form-validation";

const allowGuestAccess = !isSelfHosted;

export function LoginForm() {
  const { t } = useTranslation();

  const { register, handleSubmit, getValues, formState, setError } = useForm<{
    email: string;
  }>({
    defaultValues: { email: "" },
  });

  const { data: providers } = useQuery(["providers"], getProviders, {
    cacheTime: Infinity,
    staleTime: Infinity,
  });

  const session = useSession();
  const queryClient = trpc.useUtils();
  const [email, setEmail] = React.useState<string>();
  const posthog = usePostHog();
  const router = useRouter();
  const callbackUrl = (useSearchParams()?.get("callbackUrl") as string) ?? "/";

  const alternativeLoginMethods = React.useMemo(() => {
    const res: Array<{ login: () => void; icon: JSX.Element; name: string }> =
      [];
    if (allowGuestAccess) {
      res.push({
        login: () => {
          router.push(callbackUrl);
        },
        icon: <UserIcon className="text-muted-foreground size-5" />,
        name: t("continueAsGuest"),
      });
    }

    if (providers?.oidc) {
      res.push({
        login: () => {
          signIn("oidc", {
            callbackUrl,
          });
        },
        icon: <UserIcon className="text-muted-foreground size-5" />,
        name: t("loginWith", { provider: providers.oidc.name }),
      });
    }

    if (providers?.google) {
      res.push({
        login: () => {
          signIn("google", {
            callbackUrl,
          });
        },
        icon: (
          <Image src="/static/google.svg" width={20} height={20} alt="Google" />
        ),
        name: t("loginWith", { provider: providers.google.name }),
      });
    }
    return res;
  }, [callbackUrl, providers, router, t]);

  if (!providers) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Spinner className="text-muted-foreground" />
      </div>
    );
  }

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
            await queryClient.invalidate();
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
        email={getValues("email")}
        onChangeEmail={() => {
          setEmail(undefined);
        }}
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
        {alternativeLoginMethods.length > 0 ? (
          <>
            <hr className="border-grey-500 my-4 border-t" />
            <div className="grid gap-4">
              {alternativeLoginMethods.map((method, i) => (
                <Button size="lg" key={i} onClick={method.login}>
                  {method.icon}
                  {method.name}
                </Button>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </form>
  );
}
