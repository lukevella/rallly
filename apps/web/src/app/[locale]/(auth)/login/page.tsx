import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import { GoogleProvider } from "@/auth/providers/google";
import { MicrosoftProvider } from "@/auth/providers/microsoft";
import { OIDCProvider } from "@/auth/providers/oidc";
import { getTranslation } from "@/i18n/server";

import {
  AuthPageContainer,
  AuthPageContent,
  AuthPageDescription,
  AuthPageExternal,
  AuthPageHeader,
  AuthPageTitle,
} from "../components/auth-page";
import { AuthErrors } from "./components/auth-errors";
import { LoginWithEmailForm } from "./components/login-email-form";
import { LoginWithOIDC } from "./components/login-with-oidc";
import { OrDivider } from "./components/or-divider";
import { SSOProvider } from "./components/sso-provider";

export default async function LoginPage(props: {
  searchParams?: Promise<{
    redirectTo?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const { t } = await getTranslation();

  const oidcProvider = OIDCProvider();
  const socialProviders = [GoogleProvider(), MicrosoftProvider()].filter(
    Boolean,
  );
  const hasAlternateLoginMethods = socialProviders.length > 0 || !!oidcProvider;

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
      <AuthPageExternal>
        <Trans
          t={t}
          i18nKey="loginFooter"
          defaults="Don't have an account? <a>Sign up</a>"
          components={{
            a: <Link className="text-link" href="/register" />,
          }}
        />
      </AuthPageExternal>
    </AuthPageContainer>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const { t } = await getTranslation(params.locale);
  return {
    title: t("login"),
  };
}
