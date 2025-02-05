import { Button } from "@rallly/ui/button";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Trans } from "react-i18next/TransWithoutContext";

import { getTranslation } from "@/i18n/server";

import {
  AuthPageContainer,
  AuthPageContent,
  AuthPageDescription,
  AuthPageHeader,
  AuthPageTitle,
} from "../../components/auth-page";
import { OTPForm } from "./components/otp-form";

export default async function VerifyPage() {
  const { t } = await getTranslation();
  const token = cookies().get("registration-token")?.value;

  if (!token) {
    redirect("/register");
  }

  return (
    <AuthPageContainer>
      <AuthPageHeader>
        <AuthPageTitle>
          <Trans
            t={t}
            ns="app"
            i18nKey="verifyEmailTitle"
            defaults="Verify Your Email"
          />
        </AuthPageTitle>
        <AuthPageDescription>
          <Trans
            t={t}
            ns="app"
            i18nKey="verifyEmailDescription"
            defaults="Please check your email for a verification code"
          />
        </AuthPageDescription>
      </AuthPageHeader>
      <AuthPageContent>
        <OTPForm token={token} />
        <Button size="lg" variant="link" className="w-full" asChild>
          <Link href="/register">
            <Trans t={t} ns="app" i18nKey="back" defaults="Back" />
          </Link>
        </Button>
      </AuthPageContent>
    </AuthPageContainer>
  );
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("verifyEmail", {
      ns: "app",
      defaultValue: "Verify your email",
    }),
  };
}
