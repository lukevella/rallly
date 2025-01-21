import { unstable_cache } from "next/cache";
import Link from "next/link";
import { getProviders } from "next-auth/react";
import { Trans } from "react-i18next/TransWithoutContext";

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
import { SSOProviders } from "./sso-providers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getOAuthProviders() {
  const providers = await getProviders();
  if (!providers) {
    return [];
  }

  return Object.values(providers)
    .filter((provider) => provider.type === "oauth")
    .map((provider) => ({
      id: provider.id,
      name: provider.name,
    }));
}

// Cache the OAuth providers to avoid re-fetching them on every page load
const getCachedOAuthProviders = unstable_cache(
  getOAuthProviders,
  ["oauth-providers"],
  {
    revalidate: false,
  },
);

export default async function LoginPage() {
  const { t } = await getTranslation();
  const oAuthProviders = await getCachedOAuthProviders();
  const socialProviders = oAuthProviders.filter(
    (provider) => provider.id !== "oidc",
  );

  const oidcProvider = oAuthProviders.find(
    (provider) => provider.id === "oidc",
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
        {oidcProvider ? (
          <div className="text-center">
            <LoginWithOIDC>
              <Trans
                t={t}
                i18nKey="continueWithProvider"
                ns="app"
                defaultValue="Login with {{provider}}"
                values={{ provider: oidcProvider.name }}
              />
            </LoginWithOIDC>
          </div>
        ) : null}
        {socialProviders.length > 0 ? (
          <>
            <OrDivider text={t("or")} />
            <SSOProviders />
          </>
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
