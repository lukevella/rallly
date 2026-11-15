import { locale as getLocale } from "next/root-params";
import ErrorPage from "@/components/error-page";
import { getTranslation } from "@/i18n/server";

export default async function Page() {
  const { t } = await getTranslation(await getLocale(), "common");
  return (
    <ErrorPage
      title={t("notFoundTitle")}
      description={t("notFoundDescription")}
      homeLabel={t("goToHome")}
      supportLabel={t("support")}
    />
  );
}
