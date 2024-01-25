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
      <div className="mt-4 pt-4 text-center text-gray-500 sm:text-base">
        <Trans
          t={t}
          i18nKey="notRegistered"
          defaults="Don't have an account? <a>Register</a>"
          components={{
            a: <Link href="/register" className="text-link" />,
          }}
        />
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("login"),
  };
}
