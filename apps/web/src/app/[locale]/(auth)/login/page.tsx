import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
import { TFunction } from "i18next";
import { unstable_cache } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { getProviders } from "next-auth/react";
import { Trans } from "react-i18next/TransWithoutContext";

import { AuthErrors } from "@/app/[locale]/(auth)/login/_components/auth-errors";
import { getTranslation } from "@/app/i18n";

import { LoginWithEmailForm } from "./_components/login-email-form";
import { OrDivider } from "./_components/or-divider";
import { SSOProvider } from "./_components/sso-provider";
import {
  LoginCard,
  LoginCardContent,
  LoginCardDescription,
  LoginCardHeader,
  LoginCardTitle,
} from "./_components/login-card";
import { LoginWithOIDC } from "./_components/login-with-oidc";

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

export default async function LoginPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const { t } = await getTranslation(locale);
  const oAuthProviders = await getCachedOAuthProviders();
  const socialProviders = oAuthProviders.filter(
    (provider) => provider.id !== "oidc",
  );

  const oidcProvider = oAuthProviders.find(
    (provider) => provider.id === "oidc",
  );

  return (
    <div className="space-y-6">
      <LoginCard>
        <LoginCardHeader>
          <LoginCardTitle>
            {t("login", {
              ns: "app",
              defaultValue: "Login",
            })}
          </LoginCardTitle>
          <LoginCardDescription>
            <Trans
              t={t}
              ns="app"
              i18nKey="stepSummary"
              defaults="Step {current} of {total}"
              values={{ current: 1, total: 2 }}
            />
          </LoginCardDescription>
        </LoginCardHeader>
        <LoginCardContent>
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
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${socialProviders.length}, minmax(0, 1fr))`,
                }}
              >
                {socialProviders.map((provider) => (
                  <SSOProvider
                    key={provider.id}
                    providerId={provider.id}
                    name={provider.name}
                  />
                ))}
              </div>
            </>
          ) : null}
          <AuthErrors />
        </LoginCardContent>
      </LoginCard>
      <p className="text-muted-foreground text-center text-sm">
        <Trans
          t={t}
          i18nKey="loginFooter"
          defaults="Don't have an account? <a>Sign up</a>"
          components={{
            a: <Link className="text-link" href="/register" />,
          }}
        />
      </p>
    </div>
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
