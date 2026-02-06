import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Trans } from "@/components/trans";
import { env } from "@/env";
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

export default async function ForgotPasswordPage() {
  if (env.EMAIL_LOGIN_ENABLED === "false") {
    notFound();
  }
  const session = await getSession();
  if (session && !session.user?.isGuest) {
    redirect("/");
  }

  return (
    <AuthPageContainer>
      <AuthPageHeader>
        <AuthPageTitle>
          <Trans i18nKey="forgotPasswordTitle" defaults="Forgot Password" />
        </AuthPageTitle>
        <AuthPageDescription>
          <Trans
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
