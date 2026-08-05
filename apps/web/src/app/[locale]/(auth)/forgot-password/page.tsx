import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Trans } from "react-i18next/TransWithoutContext";
import { env } from "@/env";
import { getTranslation } from "@/i18n/server";
import { redirectIfLoggedIn } from "@/lib/auth";
import {
  AuthPageContainer,
  AuthPageContent,
  AuthPageDescription,
  AuthPageExternal,
  AuthPageHeader,
  AuthPageTitle,
} from "../components/auth-page";
import { LinkWithRedirectTo } from "../components/link-with-redirect-to";
import { ForgotPasswordForm } from "./components/forgot-password-form";

export default async function ForgotPasswordPage() {
  if (env.EMAIL_LOGIN_ENABLED === "false") {
    notFound();
  }
  await redirectIfLoggedIn();
  const { t, i18n } = await getTranslation();

  return (
    <AuthPageContainer>
      <AuthPageHeader>
        <AuthPageTitle>
          <Trans
            t={t}
            i18n={i18n}
            ns="app"
            i18nKey="forgotPasswordTitle"
            defaults="Forgot password"
          />
        </AuthPageTitle>
        <AuthPageDescription>
          <Trans
            t={t}
            i18n={i18n}
            ns="app"
            i18nKey="forgotPasswordDescription"
            defaults="Enter your email address and we'll send you a link to reset your password."
          />
        </AuthPageDescription>
      </AuthPageHeader>
      <AuthPageContent>
        <ForgotPasswordForm />
      </AuthPageContent>
      <AuthPageExternal>
        <Trans
          t={t}
          i18n={i18n}
          ns="app"
          i18nKey="forgotPasswordFooter"
          defaults="Remember your password? <a>Back to login</a>"
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
    title: t("forgotPassword", { defaultValue: "Forgot password?" }),
  };
}
