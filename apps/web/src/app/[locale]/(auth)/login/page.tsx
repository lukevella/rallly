import { Button } from "@rallly/ui/button";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { getProviders } from "next-auth/react";

import { AuthErrors } from "@/app/[locale]/(auth)/login/components/auth-errors";
import { getTranslation } from "@/app/i18n";

import { LoginWithEmailForm } from "./components/login-email-form";
import {
  LoginCard,
  LoginCardDescription,
  LoginCardHeader,
  LoginCardTitle,
} from "./components/login-layout";
import { OrDivider } from "./components/or-divider";
import { SSOProvider } from "./components/sso-provider";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getOAuthProviders() {
  const providers = await getProviders();
  if (!providers) {
    return [];
  }

  return Object.values(providers)
    .filter((provider) => {
      if (provider.type === "oauth") {
        return true;
      }
      return false;
    })
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
  const oAuthProviders = await getCachedOAuthProviders();
  const { t } = await getTranslation(locale);
  return (
    <LoginCard>
      <LoginCardHeader>
        <LoginCardTitle>
          {t("login", {
            ns: "app",
            defaultValue: "Login",
          })}
        </LoginCardTitle>
        <LoginCardDescription>
          {t("loginDescription", {
            ns: "app",
            defaultValue: "Use your email or another service to log in.",
          })}
        </LoginCardDescription>
      </LoginCardHeader>
      <LoginWithEmailForm />
      <OrDivider text={t("or")} />
      <div className="grid gap-2.5">
        {oAuthProviders.map((provider) => (
          <SSOProvider
            key={provider.id}
            providerId={provider.id}
            name={provider.name}
          />
        ))}
      </div>
      <AuthErrors />
      <div className="flex justify-center">
        <Button variant="link" asChild>
          <Link href="/register">
            {t("signUp", {
              ns: "app",
              defaultValue: "Sign up",
            })}
          </Link>
        </Button>
      </div>
    </LoginCard>
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
