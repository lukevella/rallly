import { buttonVariants } from "@rallly/ui";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
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
import { RegisterOTPForm } from "./components/register-otp-form";

export default async function RegisterVerifyPage() {
  await redirectIfLoggedIn();
  const { t } = await getTranslation();

  if (!(await getRegistrationEnabled())) {
    notFound();
  }

  const email = (await cookies()).get("verification-email")?.value;
  if (!email) {
    redirect("/register");
  }

  return (
    <AuthPageContainer>
      <AuthPageHeader>
        <AuthPageTitle>
          <Trans
            t={t}
            ns="app"
            i18nKey="registerVerifyTitle"
            defaults="Finish Signing Up"
          />
        </AuthPageTitle>
        <AuthPageDescription>
          <Trans
            t={t}
            ns="app"
            i18nKey="registerVerifyDescription"
            defaults="Enter the 6-digit code we sent to <b>{email}</b>"
            values={{ email }}
            components={{
              b: <strong className="font-medium text-foreground" />,
            }}
          />
        </AuthPageDescription>
      </AuthPageHeader>
      <AuthPageContent>
        <RegisterOTPForm email={email} />
        <LinkWithRedirectTo
          href="/register"
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
