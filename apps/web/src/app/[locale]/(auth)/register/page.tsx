import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Trans } from "react-i18next/TransWithoutContext";

import { getTranslation } from "@/app/i18n";

import {
  LoginCard,
  LoginCardDescription,
  LoginCardHeader,
  LoginCardTitle,
} from "../login/components/login-layout";
import { RegisterNameForm } from "./components/register-name-form";

export default async function Register({
  params,
}: {
  params: { locale: string };
}) {
  const { t } = await getTranslation(params.locale);
  const email = cookies().get("register.email")?.value;
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
            i18nKey="signUpTitle"
            defaults="Create your account"
          />
        </LoginCardTitle>
        <LoginCardDescription>
          <Trans
            t={t}
            ns="app"
            i18nKey="signUpDescription"
            defaults="Enter your details to continue"
          />
        </LoginCardDescription>
      </LoginCardHeader>
      <RegisterNameForm email="" />
    </LoginCard>
  );
}
