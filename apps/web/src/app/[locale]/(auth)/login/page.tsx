import { Params } from "@/app/[locale]/types";
import { getTranslation } from "@/app/i18n";
import { LoginForm } from "@/components/auth/auth-forms";

export default function LoginPage() {
  return <LoginForm />;
}

export async function generateMetadata({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("login"),
  };
}
