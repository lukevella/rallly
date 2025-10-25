import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Trans } from "react-i18next/TransWithoutContext";
import { env } from "@/env";
import { getTranslation } from "@/i18n/server";
import { authLib, getSession } from "@/lib/auth";
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

async function loadData() {
  const [isRegistrationEnabled, { t }] = await Promise.all([
    getRegistrationEnabled(),
    getTranslation(),
  ]);

  return {
    isRegistrationEnabled,
    t,
  };
}

export default async function LoginPage(props: {
  searchParams?: Promise<{
    redirectTo?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const session = await getSession();
  if (session && !session.user?.isGuest) {
    return redirect("/");
  }
  const { isRegistrationEnabled, t } = await loadData();
  const isEmailLoginEnabled = isFeatureEnabled("emailLogin");

  const hasGoogleProvider = !!authLib.options.socialProviders.google;
  const hasMicrosoftProvider = !!authLib.options.socialProviders.microsoft;
  const hasOidc = !!authLib.options.plugins.find(
    (plugin) => plugin.id === "generic-oauth",
  );
  const hasAlternateLoginMethods =
    hasGoogleProvider || hasMicrosoftProvider || hasOidc;

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
          {hasOidc ? (
            <LoginWithOIDC
              name={env.OIDC_NAME}
              redirectTo={searchParams?.redirectTo}
            />
          ) : null}
          {hasGoogleProvider ? (
            <SSOProvider
              providerId="google"
              name="Google"
              redirectTo={searchParams?.redirectTo}
            />
          ) : null}
          {hasMicrosoftProvider ? (
            <SSOProvider
              providerId="microsoft"
              name="Microsoft"
              redirectTo={searchParams?.redirectTo}
            />
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
  const params = await props.params;
  const { t } = await getTranslation(params.locale);
  return {
    title: t("login"),
  };
}
