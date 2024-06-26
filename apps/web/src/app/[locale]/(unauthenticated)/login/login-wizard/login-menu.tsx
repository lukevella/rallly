"use client";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

import { SSOMenu } from "@/app/[locale]/(unauthenticated)/login/login-wizard/sso-menu";
import { useOAuthProviders } from "@/app/[locale]/(unauthenticated)/login/oauth-providers";
import { Spinner } from "@/components/spinner";

import { LoginWithEmailForm } from "./login-email-form";

export function LoginMenu() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");

  const { t } = useTranslation();

  const { isFetched } = useOAuthProviders();

  if (!isFetched) {
    return (
      <div className="flex justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-0.5">
          <h1 className="text-lg font-bold tracking-tight">
            {t("login", {
              defaultValue: "Login",
            })}
          </h1>
          <p className="text-sm text-gray-500">
            {t("loginDescription", {
              defaultValue: "Use your email or another service to log in.",
            })}
          </p>
        </div>
      </div>
      <LoginWithEmailForm />
      <SSOMenu />
      {error === "OAuthAccountNotLinked" ? (
        <p className="text-rose-600">
          {t("accountNotLinkedDescription", {
            defaultValue:
              "A user with this email already exists. Please log in using the original method.",
          })}
        </p>
      ) : null}
    </div>
  );
}
