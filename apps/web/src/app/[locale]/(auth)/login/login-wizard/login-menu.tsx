import { useTranslation } from "react-i18next";

import { SSOMenu } from "@/app/[locale]/(auth)/login/login-wizard/sso-menu";
import { useOAuthProviders } from "@/app/[locale]/(auth)/login/oauth-providers";
import { Spinner } from "@/components/spinner";

import { LoginWithEmailForm } from "./login-email-form";

export function LoginMenu() {
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
            {t("loginOrSignUp", {
              defaultValue: "Login or sign up in seconds",
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
    </div>
  );
}
