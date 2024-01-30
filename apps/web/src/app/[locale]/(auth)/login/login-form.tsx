"use client";
import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { Button } from "@rallly/ui/button";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangleIcon, UserIcon } from "lucide-react";
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
  const searchParams = useSearchParams();

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
  const callbackUrl = searchParams?.get("callbackUrl") ?? "/";

  const error = searchParams?.get("error");

  const alternativeLoginMethods = React.useMemo(() => {
    const res: Array<{ login: () => void; icon: JSX.Element; name: string }> =
      [];
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

    if (providers?.["azure-ad"]) {
      res.push({
        login: () => {
          signIn("azure-ad", {
            callbackUrl,
          });
        },
        icon: (
          <Image
            src="/static/microsoft.svg"
            width={20}
            height={20}
            alt="Azure AD"
          />
        ),
        name: t("loginWith", { provider: "Microsoft" }),
      });
    }

    if (allowGuestAccess) {
      res.push({
        login: () => {
          router.push(callbackUrl);
        },
        icon: <UserIcon className="text-muted-foreground size-5" />,
        name: t("continueAsGuest"),
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
      <fieldset className="mb-2.5">
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
          {t("loginWith", {
            provider: t("email"),
          })}
        </Button>
        {error === "OAuthAccountNotLinked" ? (
          <Alert icon={AlertTriangleIcon} variant="destructive">
            <AlertTitle>
              {t("accountNotLinkedTitle", {
                defaultValue:
                  "Your account cannot be linked to an existing user",
              })}
            </AlertTitle>
            <AlertDescription>
              {t("accountNotLinkedDescription", {
                defaultValue:
                  "A user with this email already exists. Please log in using the original method.",
              })}
            </AlertDescription>
          </Alert>
        ) : null}
        {alternativeLoginMethods.length > 0 ? (
          <>
            <div className="relative my-4">
              <hr className="border-grey-500 absolute top-1/2 w-full border-t" />
              <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 transform bg-white px-2 text-center text-xs uppercase text-gray-400">
                {t("or", { defaultValue: "Or" })}
              </span>
            </div>
            <div className="grid gap-2.5">
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
