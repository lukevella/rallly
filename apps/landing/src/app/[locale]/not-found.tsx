"use client";

import ErrorPage from "@/components/error-page";
import { useTranslation } from "@/i18n/client/use-translation";

export default function Page() {
  const { t } = useTranslation("common");
  return (
    <ErrorPage
      title={t("notFoundTitle")}
      description={t("notFoundDescription")}
    />
  );
}
