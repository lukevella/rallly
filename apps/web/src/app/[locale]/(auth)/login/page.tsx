import type { Metadata } from "next";
import { Trans } from "react-i18next/TransWithoutContext";

import { GoogleProvider } from "@/auth/providers/google";
import { MicrosoftProvider } from "@/auth/providers/microsoft";
import { OIDCProvider } from "@/auth/providers/oidc";
import { getInstanceSettings } from "@/features/instance-settings/queries";
import { getTranslation } from "@/i18n/server";
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
  const [instanceSettings, { t }] = await Promise.all([
    getInstanceSettings(),
    getTranslation(),
  ]);

  return {
    instanceSettings,
    t,
  };
}

export default async function LoginPage(props: {
  searchParams?: Promise<{
    redirectTo?: string;
  }>;
}) {
  const searchParams = await props.searchParams;

  const { instanceSettings, t } = await loadData();
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
          <Trans t={t} ns="app" i18nKey="loginTitle" defaults="Welcome" />
        </AuthPageTitle>
        <AuthPageDescription>
          <Trans
            t={t}
            ns="app"
            i18nKey="loginDescription"
            defaults="Login to your account to continue"
          />
        </AuthPageDescription>
      </AuthPageHeader>
      <AuthPageContent>
        <LoginWithEmailForm />
        {hasAlternateLoginMethods ? <OrDivider /> : null}
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
      {!instanceSettings?.disableUserRegistration ? (
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
