import { notFound } from "next/navigation";
import { Trans } from "react-i18next/TransWithoutContext";

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
import { RegisterNameForm } from "./components/register-name-form";

export default async function Register(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const { t } = await getTranslation(params.locale);
  const instanceSettings = await getInstanceSettings();

  if (instanceSettings?.disableUserRegistration) {
    return notFound();
  }

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
}) {
  const params = await props.params;
  const { t } = await getTranslation(params.locale);
  return {
    title: t("register"),
  };
}
