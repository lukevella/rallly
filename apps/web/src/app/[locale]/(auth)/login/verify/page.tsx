import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { ArrowLeftIcon } from "lucide-react";
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
} from "../_components/login-card";
import { OTPForm } from "./_components/otp-form";

export default async function VerifyPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const { t } = await getTranslation(locale);
  const email = cookies().get("verification-email")?.value;
  if (!email) {
    return redirect("/login");
  }
  return (
    <LoginCard>
      <LoginCardHeader>
        <LoginCardTitle>
          <Trans
            t={t}
            ns="app"
            i18nKey="finishLoggingIn"
            defaults="Finish logging in"
          />
        </LoginCardTitle>
        <LoginCardDescription>
          <Trans
            t={t}
            ns="app"
            i18nKey="enterCode"
            defaults="Check your email for the verification code."
          />
        </LoginCardDescription>
      </LoginCardHeader>
      <LoginCardContent>
        {/* <p className="flex h-9 items-center gap-2 rounded-md border bg-gray-100 px-2 text-sm">
          {email}
          <Link href="/login">
            <PencilLineIcon className="text-primary size-4" />
          </Link>
        </p> */}
        <OTPForm email={email} />
        <div className="flex justify-center">
          <Button variant="link" asChild>
            <Link href="/login">
              <Trans t={t} ns="app" i18nKey="back" defaults="Back" />
            </Link>
          </Button>
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
