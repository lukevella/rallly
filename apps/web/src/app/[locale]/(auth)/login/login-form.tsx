"use client";
import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { Button } from "@rallly/ui/button";
import { Input } from "@rallly/ui/input";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangleIcon, UserIcon } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { getProviders, signIn, useSession } from "next-auth/react";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { trpc } from "@/app/providers";
import { VerifyCode, verifyCode } from "@/components/auth/auth-forms";
import { Spinner } from "@/components/spinner";
import { isSelfHosted } from "@/utils/constants";
import { validEmail } from "@/utils/form-validation";
import { usePostHog } from "@/utils/posthog";

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
  const router = useRouter();
  const callbackUrl = searchParams?.get("callbackUrl") ?? "/";
  const autoOidcRedirect = searchParams?.get("autoOidcRedirect") ?? '0';

  const error = searchParams?.get("error");

  const posthog = usePostHog();

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
          posthog?.capture("click continue as guest");
        },
        icon: <UserIcon className="text-muted-foreground size-5" />,
        name: t("continueAsGuest"),
      });
    }
    return res;
  }, [callbackUrl, posthog, providers, router, t]);

  useEffect(() => {
    if (alternativeLoginMethods.length === 1 && autoOidcRedirect === '1' && !error) {
      alternativeLoginMethods[0].login();
    }
  }, [alternativeLoginMethods, autoOidcRedirect, error]);

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
          }

          await queryClient.invalidate();
          await session.update();

          router.push(callbackUrl);
        }}
        email={getValues("email")}
      />
    );
  }

  if (error) {
    return (
      <>
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
        ) : (
          <Alert icon={AlertTriangleIcon} variant="destructive">
            <AlertTitle>Fehler</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </>
    );
  }

  if (autoOidcRedirect === '1') {
    return null;
  }

  return (
    <>
      {alternativeLoginMethods.length > 0 ? (
        <>
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
    </>
  );
}
