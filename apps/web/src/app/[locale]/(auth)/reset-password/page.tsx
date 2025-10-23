import type { Metadata } from "next";
import { Trans } from "@/components/trans";
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
  return (
    <AuthPageContainer>
      <AuthPageHeader>
        <AuthPageTitle>
          <Trans i18nKey="resetPasswordTitle" defaults="Create new password" />
        </AuthPageTitle>
        <AuthPageDescription>
          <Trans
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
          i18nKey="resetPasswordFooter"
          defaults="<a>Back to login</a>"
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
