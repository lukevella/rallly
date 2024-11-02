import { RegisterForm } from "@/app/[locale]/(auth)/register/register-page";
import type { Params } from "@/app/[locale]/types";
import { getTranslation } from "@/i18n/server";

export default async function Page() {
  return <RegisterForm />;
}

export async function generateMetadata({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("register"),
  };
}
