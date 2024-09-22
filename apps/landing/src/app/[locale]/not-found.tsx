import ErrorPage from "@/components/error-page";
import { getTranslation } from "@/i18n/server";

export default async function Page() {
  // TODO (Luke Vella) [2023-11-03]: not-found doesn't have access to params right now
  // See: https://github.com/vercel/next.js/discussions/43179
  const { t } = await getTranslation("en");

  return (
    <ErrorPage
      title={t("notFoundTitle")}
      description={t("notFoundDescription")}
    />
  );
}
