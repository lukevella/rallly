import { buttonVariants } from "@rallly/ui";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Trans } from "react-i18next/TransWithoutContext";

import { getTranslation } from "@/i18n/server";
import { redirectIfLoggedIn } from "@/lib/auth";
import {
  AuthPageContainer,
  AuthPageContent,
  AuthPageDescription,
  AuthPageHeader,
  AuthPageTitle,
} from "../../components/auth-page";
import { OTPForm } from "./components/otp-form";

export default async function VerifyPage() {
  await redirectIfLoggedIn();
  const { t } = await getTranslation();
  const email = (await cookies()).get("verification-email")?.value;
  if (!email) {
    redirect("/login");
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
            i18nKey="loginVerifyCheckEmail"
            defaults="If an account exists with this email, you will receive a verification code at <b>{email}</b>"
            values={{ email }}
            components={{
              b: <strong className="font-medium text-foreground" />,
            }}
          />
        </AuthPageDescription>
      </AuthPageHeader>
      <AuthPageContent>
        <OTPForm email={email} />
        <Link
          href="/login"
          className={buttonVariants({
            size: "lg",
            variant: "link",
            className: "w-full",
          })}
        >
          <Trans t={t} ns="app" i18nKey="back" defaults="Back" />
        </Link>
      </AuthPageContent>
    </AuthPageContainer>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getTranslation(params.locale);
  return {
    title: t("verifyEmail", {
      ns: "app",
      defaultValue: "Verify your email",
    }),
  };
}
