import type { Metadata } from "next";
import { Trans } from "react-i18next/TransWithoutContext";
import { OIDCAutoSignIn } from "@/app/[locale]/(auth)/login/components/oidc-auto-sign-in";
import { env } from "@/env";
import { LoginWithOIDC } from "@/features/auth/components/login-with-oidc";
import { OrDivider } from "@/features/auth/components/or-divider";
import { SSOProvider } from "@/features/auth/components/sso-provider";
import { getRegistrationEnabled } from "@/features/instance-settings/data";
import { getTranslation } from "@/i18n/server";
import { authLib, getSessionState } from "@/lib/auth";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { AlreadyLoggedIn } from "../components/already-logged-in";
import {
  AuthPageContainer,
  AuthPageContent,
  AuthPageDescription,
  AuthPageHeader,
  AuthPageTitle,
} from "../components/auth-page";
import { AuthErrors } from "./components/auth-errors";
import { LoginWithEmailForm } from "./components/login-email-form";

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
    error?: string;
  }>;
}) {
  const searchParams = await props.searchParams;

  // No automatic redirect to / — an automated redirect here is one leg of
  // the / ↔ /login redirect loop. The user must click through.
  // On "error" the session is unknown, so we fall through to the login
  // form rather than guess.
  const sessionState = await getSessionState();
  if (
    sessionState.status === "authenticated" &&
    !sessionState.session.user.isGuest
  ) {
    return <AlreadyLoggedIn redirectTo={searchParams?.redirectTo} />;
  }

  const { isRegistrationEnabled, t } = await loadData();
  const isEmailLoginEnabled = isFeatureEnabled("emailLogin");

  const hasGoogleProvider = !!authLib.options.socialProviders.google;
  const hasMicrosoftProvider = !!authLib.options.socialProviders.microsoft;
  const hasOidc = !!authLib.options.plugins.find(
    (plugin) => plugin.id === "generic-oauth",
  );

  const hasSocialLogin = hasGoogleProvider || hasMicrosoftProvider;

  const hasAlternateLoginMethods = hasSocialLogin || hasOidc;

  const hasError = !!searchParams?.error;

  const shouldAutoSignIn =
    hasOidc && !hasError && !isEmailLoginEnabled && !hasSocialLogin;
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
          ) : isRegistrationEnabled ? (
            <Trans
              t={t}
              ns="app"
              i18nKey="loginOrSignUpDescription"
              defaults="Log in to your account or create a new one"
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
        {isEmailLoginEnabled && (
          <LoginWithEmailForm isRegistrationEnabled={isRegistrationEnabled} />
        )}
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
