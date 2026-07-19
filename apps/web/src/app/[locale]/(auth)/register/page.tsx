import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Trans } from "react-i18next/TransWithoutContext";
import { env } from "@/env";
import { LoginWithOIDC } from "@/features/auth/components/login-with-oidc";
import { OrDivider } from "@/features/auth/components/or-divider";
import { SSOProvider } from "@/features/auth/components/sso-provider";
import { getRegistrationEnabled } from "@/features/instance-settings/data";
import { getTranslation } from "@/i18n/server";
import { authLib, redirectIfLoggedIn } from "@/lib/auth";
import {
  AuthPageContainer,
  AuthPageContent,
  AuthPageDescription,
  AuthPageExternal,
  AuthPageHeader,
  AuthPageTitle,
} from "../components/auth-page";
import { LinkWithRedirectTo } from "../components/link-with-redirect-to";
import { RegisterNameForm } from "./components/register-name-form";

export default async function Register(props: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ redirectTo?: string }>;
}) {
  await redirectIfLoggedIn();
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { t } = await getTranslation(params.locale);
  const isRegistrationEnabled = await getRegistrationEnabled();

  if (!isRegistrationEnabled) {
    notFound();
  }

  const hasGoogleProvider = !!authLib.options.socialProviders.google;
  const hasMicrosoftProvider = !!authLib.options.socialProviders.microsoft;
  const hasOidc = !!authLib.options.plugins.find(
    (plugin) => plugin.id === "generic-oauth",
  );

  const hasAlternateSignUpMethods =
    hasGoogleProvider || hasMicrosoftProvider || hasOidc;

  return (
    <AuthPageContainer>
      <AuthPageHeader>
        <AuthPageTitle>
          <Trans
            t={t}
            ns="app"
            i18nKey="registerTitle"
            defaults="Create Your Account"
          />
        </AuthPageTitle>
        <AuthPageDescription>
          <Trans
            t={t}
            ns="app"
            i18nKey="registerDescription"
            defaults="Streamline your scheduling process and save time"
          />
        </AuthPageDescription>
      </AuthPageHeader>
      <AuthPageContent>
        <RegisterNameForm />
        {hasAlternateSignUpMethods ? <OrDivider /> : null}
        {hasAlternateSignUpMethods ? (
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
        ) : null}
      </AuthPageContent>
      <AuthPageExternal>
        <Trans
          t={t}
          ns="app"
          i18nKey="alreadyHaveAccount"
          defaults="Already have an account? <a>Log in</a>"
          components={{
            a: <LinkWithRedirectTo className="text-link" href="/login" />,
          }}
        />
      </AuthPageExternal>
    </AuthPageContainer>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getTranslation(params.locale);
  return {
    title: t("register"),
  };
}
