import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import { RegisterForm } from "@/app/[locale]/(auth)/register/register-page";
import { Params } from "@/app/[locale]/types";
import { getTranslation } from "@/app/i18n";
import { AuthCard } from "@/components/auth/auth-layout";

export default async function Page({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return (
    <div>
      <AuthCard>
        <RegisterForm />
      </AuthCard>
      <div className="mt-4 text-center pt-4 text-gray-500 sm:text-base">
        <Trans
          t={t}
          i18nKey="alreadyRegistered"
          components={{
            a: <Link href="/login" className="text-link" />,
          }}
        />
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("register"),
  };
}
