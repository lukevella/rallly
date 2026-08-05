import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Trans } from "react-i18next/TransWithoutContext";
import { env } from "@/env";
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
import { ResetPasswordForm } from "./components/reset-password-form";

export default async function ResetPasswordPage() {
  if (env.EMAIL_LOGIN_ENABLED === "false") {
    notFound();
  }
  const { t, i18n } = await getTranslation();
  return (
    <AuthPageContainer>
      <AuthPageHeader>
        <AuthPageTitle>
          <Trans
            t={t}
            i18n={i18n}
            ns="app"
            i18nKey="resetPasswordTitle"
            defaults="Reset password"
          />
        </AuthPageTitle>
        <AuthPageDescription>
          <Trans
            t={t}
            i18n={i18n}
            ns="app"
            i18nKey="resetPasswordDescription"
            defaults="Enter your new password below"
          />
        </AuthPageDescription>
      </AuthPageHeader>
      <AuthPageContent>
        <ResetPasswordForm />
      </AuthPageContent>
      <AuthPageExternal>
        <Trans
          t={t}
          i18n={i18n}
          ns="app"
          i18nKey="resetPasswordFooter"
          defaults="Don't need to reset? <a>Back to login</a>"
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
    title: t("resetPasswordTitle", { defaultValue: "Reset password" }),
  };
}
