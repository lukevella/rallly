import type { Metadata } from "next";

import { GoogleProvider } from "@/auth/providers/google";
import { MicrosoftProvider } from "@/auth/providers/microsoft";
import { OIDCProvider } from "@/auth/providers/oidc";
import { Trans } from "@/components/trans";
import { getTranslation } from "@/i18n/server";
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
  const [isRegistrationEnabled] = await Promise.all([getRegistrationEnabled()]);

  return {
    isRegistrationEnabled,
  };
}

export default async function LoginPage(props: {
  searchParams?: Promise<{
    redirectTo?: string;
  }>;
}) {
  const searchParams = await props.searchParams;

  const { isRegistrationEnabled } = await loadData();
  const isEmailLoginEnabled = isFeatureEnabled("emailLogin");
  const oidcProvider = OIDCProvider();
  const socialProviders = [GoogleProvider(), MicrosoftProvider()].filter(
    Boolean,
  );
  const hasAlternateLoginMethods = [...socialProviders, oidcProvider].some(
    Boolean,
  );

  return (
    <AuthPageContainer>
      <AuthPageHeader>
        <AuthPageTitle>
          <Trans i18nKey="loginTitle" defaults="Welcome" />
        </AuthPageTitle>
        <AuthPageDescription>
          {!isEmailLoginEnabled && !hasAlternateLoginMethods ? (
            <Trans
              ns="app"
              i18nKey="loginNotConfigured"
              defaults="Login is currently not configured."
            />
          ) : (
            <Trans
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
        {oidcProvider ? (
          <LoginWithOIDC
            name={oidcProvider.name}
            redirectTo={searchParams?.redirectTo}
          />
        ) : null}
        {socialProviders ? (
          <div className="grid gap-4">
            {socialProviders.map((provider) =>
              provider ? (
                <SSOProvider
                  key={provider.id}
                  providerId={provider.id}
                  name={provider.options?.name || provider.name}
                  redirectTo={searchParams?.redirectTo}
                />
              ) : null,
            )}
          </div>
        ) : null}
      </AuthPageContent>
      <AuthErrors />
      {isRegistrationEnabled ? (
        <AuthPageExternal>
          <Trans
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
