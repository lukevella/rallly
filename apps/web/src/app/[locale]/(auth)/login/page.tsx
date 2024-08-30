import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import { LoginForm } from "@/app/[locale]/(auth)/login/login-form";
import { Params } from "@/app/[locale]/types";
import { getTranslation } from "@/app/i18n";
import { AuthCard } from "@/components/auth/auth-layout";

export default async function LoginPage({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return (
    <div>
      <AuthCard>
        <LoginForm />
      </AuthCard>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("login"),
  };
}
