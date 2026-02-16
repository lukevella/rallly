"use cache";
import type { Metadata } from "next";
import { Trans } from "react-i18next/TransWithoutContext";
import { OIDCAutoSignIn } from "@/app/[locale]/(auth)/login/components/oidc-auto-sign-in";
import { env } from "@/env";
import { getTranslation } from "@/i18n/server";
import { authLib } from "@/lib/auth";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { getRegistrationEnabled } from "@/utils/get-registration-enabled";
import {
  AuthPageContainer,
  AuthPageContent,
  AuthPageDescription,
  AuthPageExternal,
  AuthPageHeader,
  AuthPageTitle,
} from "../components/auth-page";
import { LinkWithRedirectTo } from "../components/link-with-redirect-to";
import { AuthErrors } from "./components/auth-errors";
import { LoginWithEmailForm } from "./components/login-email-form";
import { LoginWithOIDC } from "./components/login-with-oidc";
import { OrDivider } from "./components/or-divider";
import { SSOProvider } from "./components/sso-provider";

export default async function LoginPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const { t } = await getTranslation(locale);
  const isRegistrationEnabled = await getRegistrationEnabled();
  const isEmailLoginEnabled = isFeatureEnabled("emailLogin");

  const hasGoogleProvider = !!authLib.options.socialProviders.google;
  const hasMicrosoftProvider = !!authLib.options.socialProviders.microsoft;
  const hasOidc = !!authLib.options.plugins.find(
    (plugin) => plugin.id === "generic-oauth",
  );

  const hasSocialLogin = hasGoogleProvider || hasMicrosoftProvider;

  const hasAlternateLoginMethods = hasSocialLogin || hasOidc;

  const shouldAutoSignIn = hasOidc && !isEmailLoginEnabled && !hasSocialLogin;
  /**
   * If there is only one login method available, we should automatically redirect to the login page.
   */
  if (shouldAutoSignIn) {
    return <OIDCAutoSignIn />;
  }

  return (
    <AuthPageContainer>
      <AuthPageHeader>
        <AuthPageTitle>
          <Trans t={t} ns="app" i18nKey="loginTitle" defaults="Welcome" />
        </AuthPageTitle>
        <AuthPageDescription>
          {!isEmailLoginEnabled && !hasAlternateLoginMethods ? (
            <Trans
              t={t}
              ns="app"
              i18nKey="loginNotConfigured"
              defaults="Login is currently not configured."
            />
          ) : (
            <Trans
              t={t}
              ns="app"
              i18nKey="loginDescription"
              defaults="Login to your account to continue"
            />
          )}
        </AuthPageDescription>
      </AuthPageHeader>
      <AuthPageContent>
        {isEmailLoginEnabled && <LoginWithEmailForm />}
        {isEmailLoginEnabled && hasAlternateLoginMethods ? <OrDivider /> : null}
        <div className="grid gap-3">
          {hasOidc ? <LoginWithOIDC name={env.OIDC_NAME} /> : null}
          {hasGoogleProvider ? (
            <SSOProvider providerId="google" name="Google" />
          ) : null}
          {hasMicrosoftProvider ? (
            <SSOProvider providerId="microsoft" name="Microsoft" />
          ) : null}
        </div>
      </AuthPageContent>
      <AuthErrors />
      {isRegistrationEnabled ? (
        <AuthPageExternal>
          <Trans
            t={t}
            i18nKey="loginFooter"
            defaults="Don't have an account? <a>Sign up</a>"
            components={{
              a: <LinkWithRedirectTo className="text-link" href="/register" />,
            }}
          />
        </AuthPageExternal>
      ) : null}
    </AuthPageContainer>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const { t } = await getTranslation(locale);
  return {
    title: t("login"),
  };
}
