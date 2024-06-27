import { Card } from "@rallly/ui/card";

import { NextLoginWizard } from "@/app/[locale]/(unauthenticated)/login/login-wizard";
import { Params } from "@/app/[locale]/types";
import { getTranslation } from "@/app/i18n";

export default async function LoginPage() {
  return (
    <Card className="mx-auto w-full max-w-sm p-6">
      <NextLoginWizard />
    </Card>
  );
}

export async function generateMetadata({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("login"),
  };
}
