import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import { getOAuthProviders } from "@/auth";
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

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: {
    callbackUrl?: string;
  };
}) {
  const { t } = await getTranslation();
  const oAuthProviders = getOAuthProviders();

  const hasAlternateLoginMethods = oAuthProviders.length > 0;

  const oidcProvider = oAuthProviders.find(
    (provider) => provider.id === "oidc",
  );
  const socialProviders = oAuthProviders.filter(
    (provider) => provider.id !== "oidc",
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
            callbackUrl={searchParams?.callbackUrl}
          />
        ) : null}
        {socialProviders ? (
          <div className="grid gap-4">
            {socialProviders.map((provider) => (
              <SSOProvider
                key={provider.id}
                providerId={provider.id}
                name={provider.name}
                callbackUrl={searchParams?.callbackUrl}
              />
            ))}
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

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("login"),
  };
}
