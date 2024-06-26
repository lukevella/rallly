import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Trans } from "react-i18next/TransWithoutContext";

import { getTranslation } from "@/app/i18n";

import {
  LoginCard,
  LoginCardContent,
  LoginCardDescription,
  LoginCardHeader,
  LoginCardTitle,
} from "../../login/_components/login-card";
import { OTPForm } from "./_components/otp-form";

export default async function VerifyPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const { t } = await getTranslation(locale);
  const token = cookies().get("registration-token")?.value;

  if (!token) {
    redirect("/register");
  }

  return (
    <LoginCard>
      <LoginCardHeader>
        <LoginCardTitle>
          <Trans
            t={t}
            ns="app"
            i18nKey="verifyEmail"
            defaults="Verify your email"
          />
        </LoginCardTitle>
        <LoginCardDescription>
          <Trans
            t={t}
            ns="app"
            i18nKey="stepSummary"
            defaults="Step {current} of {total}"
            values={{ current: 2, total: 2 }}
          />
        </LoginCardDescription>
      </LoginCardHeader>
      <LoginCardContent>
        <OTPForm token={token} />
        <div className="text-center">
          <Link className="text-link text-sm" href="/register">
            <Trans
              t={t}
              ns="app"
              i18nKey="backToRegister"
              defaults="Back to register"
            />
          </Link>
        </div>
      </LoginCardContent>
    </LoginCard>
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
