import { buttonVariants } from "@rallly/ui";
import Link from "next/link";

import { ErrorPage } from "@/components/error-page";
import { getTranslation } from "@/i18n/server";

export default async function MaintenancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { t } = await getTranslation(locale);

  return (
    <ErrorPage
      label={t("maintenanceLabel", { defaultValue: "Maintenance" })}
      title={t("maintenanceTitle", { defaultValue: "Be right back" })}
      description={t("maintenanceDescription", {
        defaultValue:
          "We're performing scheduled maintenance. We'll be back online shortly.",
      })}
      actions={
        <Link
          href="/"
          className={buttonVariants({ size: "lg", variant: "primary" })}
        >
          {t("maintenanceTryAgain", { defaultValue: "Try again" })}
        </Link>
      }
    >
      {null}
    </ErrorPage>
  );
}
