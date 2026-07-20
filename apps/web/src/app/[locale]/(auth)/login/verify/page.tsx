import { buttonVariants } from "@rallly/ui";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Trans } from "react-i18next/TransWithoutContext";

import { getRegistrationEnabled } from "@/features/instance-settings/data";
import { getTranslation } from "@/i18n/server";
import { redirectIfLoggedIn } from "@/lib/auth";
import {
  AuthPageContainer,
  AuthPageContent,
  AuthPageDescription,
  AuthPageHeader,
  AuthPageTitle,
} from "../../components/auth-page";
import { LinkWithRedirectTo } from "../../components/link-with-redirect-to";
import { OTPForm } from "./components/otp-form";

export default async function VerifyPage() {
  await redirectIfLoggedIn();
  const { t } = await getTranslation();
  const email = (await cookies()).get("verification-email")?.value;
  if (!email) {
    redirect("/login");
  }

  const isRegistrationEnabled = await getRegistrationEnabled();

  return (
    <AuthPageContainer>
      <AuthPageHeader>
        <AuthPageTitle>
          {isRegistrationEnabled ? (
            <Trans
              t={t}
              ns="app"
              i18nKey="verifyEmailTitle"
              defaults="Verify Your Email"
            />
          ) : (
            <Trans
              t={t}
              ns="app"
              i18nKey="loginVerifyTitle"
              defaults="Finish Logging In"
            />
          )}
        </AuthPageTitle>
        <AuthPageDescription>
          {isRegistrationEnabled ? (
            <Trans
              t={t}
              ns="app"
              i18nKey="verifyEmailDescription"
              defaults="Enter the 6-digit code we sent to <b>{email}</b>"
              values={{ email }}
              components={{
                b: <strong className="font-medium text-foreground" />,
              }}
            />
          ) : (
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
          )}
        </AuthPageDescription>
      </AuthPageHeader>
      <AuthPageContent>
        <OTPForm
          email={email}
          mode={isRegistrationEnabled ? "sign-in" : "email-verification"}
        />
        <LinkWithRedirectTo
          href="/login"
          className={buttonVariants({
            size: "xl",
            variant: "link",
            className: "w-full",
          })}
        >
          <Trans t={t} ns="app" i18nKey="back" defaults="Back" />
        </LinkWithRedirectTo>
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
