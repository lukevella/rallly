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
  const email = cookies().get("verification-email")?.value;
  if (!email) {
    return redirect("/login");
  }
  return (
    <AuthPageContainer>
      <AuthPageHeader>
        <AuthPageTitle>
          <Trans
            t={t}
            ns="app"
            i18nKey="loginVerifyTitle"
            defaults="Finish Logging In"
          />
        </AuthPageTitle>
        <AuthPageDescription>
          <Trans
            t={t}
            ns="app"
            i18nKey="loginVerifyDescription"
            defaults="Check your email for the verification code"
          />
        </AuthPageDescription>
      </AuthPageHeader>
      <AuthPageContent>
        <OTPForm email={email} />
        <Button size="lg" variant="link" className="w-full" asChild>
          <Link href="/login">
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
