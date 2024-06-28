import { Card } from "@rallly/ui/card";

import { AuthErrors } from "@/app/[locale]/(auth)/login/auth-errors";
import { Login } from "@/app/[locale]/(auth)/login/login";
import { getTranslation } from "@/app/i18n";

export default async function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-sm">
      <Card className="space-y-6 p-6">
        <Login />
        <AuthErrors />
      </Card>
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
    title: t("login"),
  };
}
