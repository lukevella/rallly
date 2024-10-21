import { PencilLineIcon } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Trans } from "react-i18next/TransWithoutContext";

import { getTranslation } from "@/app/i18n";

import {
  LoginCard,
  LoginCardDescription,
  LoginCardHeader,
  LoginCardTitle,
} from "../components/login-layout";
import { OTPForm } from "./components/otp-form";

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
      <p className="flex items-center justify-center gap-2 text-sm">
        {email}
        <Link href="/login">
          <PencilLineIcon className="text-primary size-4" />
        </Link>
      </p>
      <OTPForm email={email} />
    </LoginCard>
  );
}
