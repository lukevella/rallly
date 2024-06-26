import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import { getTranslation } from "@/i18n/server";

import {
  LoginCard,
  LoginCardDescription,
  LoginCardHeader,
  LoginCardTitle,
} from "../login/_components/login-card";
import { RegisterNameForm } from "./_components/register-name-form";

export default async function Register({
  params,
}: {
  params: { locale: string };
}) {
  const { t } = await getTranslation(params.locale);

  return (
    <div className="space-y-6">
      <LoginCard>
        <LoginCardHeader>
          <LoginCardTitle>
            <Trans
              t={t}
              ns="app"
              i18nKey="createAnAccount"
              defaults="Create an account"
            />
          </LoginCardTitle>
          <LoginCardDescription>
            <Trans
              t={t}
              ns="app"
              i18nKey="stepSummary"
              defaults="Step {current} of {total}"
              values={{ current: 1, total: 2 }}
            />
          </LoginCardDescription>
        </LoginCardHeader>
        <RegisterNameForm />
      </LoginCard>
      <p className="text-muted-foreground text-center text-sm">
        <Trans
          t={t}
          ns="app"
          i18nKey="alreadyHaveAccount"
          defaults="Already have an account? <a>Log in</a>"
          components={{
            a: <Link className="text-link" href="/login" />,
          }}
        />
      </p>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("register"),
  };
}
