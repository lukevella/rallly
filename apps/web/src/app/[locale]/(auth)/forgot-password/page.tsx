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
import { ForgotPasswordForm } from "./components/forgot-password-form";

async function loadData() {
  const { t } = await getTranslation();

  return {
    t,
  };
}

export default async function ForgotPasswordPage() {
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
            i18nKey="forgotPasswordTitle"
            defaults="Reset your password"
          />
        </AuthPageTitle>
        <AuthPageDescription>
          <Trans
            t={t}
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
    title: t("forgotPassword", { defaultValue: "Forgot Password" }),
  };
}
