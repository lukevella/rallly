import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Trans } from "react-i18next/TransWithoutContext";
import { getTranslation } from "@/i18n/server";
import { getSession } from "@/lib/auth";
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

async function loadData() {
  const { t } = await getTranslation();

  return {
    t,
  };
}

export default async function ResetPasswordPage() {
  const session = await getSession();
  if (session && !session.user?.isGuest) {
    return redirect("/");
  }

  const { t } = await loadData();

  return (
    <AuthPageContainer>
      <AuthPageHeader>
        <AuthPageTitle>
          <Trans
            t={t}
            ns="app"
            i18nKey="resetPasswordTitle"
            defaults="Create new password"
          />
        </AuthPageTitle>
        <AuthPageDescription>
          <Trans
            t={t}
            ns="app"
            i18nKey="resetPasswordDescription"
            defaults="Enter your new password below to reset your account."
          />
        </AuthPageDescription>
      </AuthPageHeader>
      <AuthPageContent>
        <ResetPasswordForm />
      </AuthPageContent>
      <AuthPageExternal>
        <Trans
          t={t}
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
    title: t("resetPassword", { defaultValue: "Reset Password" }),
  };
}
