import { Params } from "@/app/[locale]/types";
import { getTranslation } from "@/app/i18n";

import { PreferencesPage } from "./preferences-page";

export default async function Page() {
  return <PreferencesPage />;
}

export async function generateMetadata({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("preferences"),
  };
}
