import type { Metadata } from "next";
import type { Params } from "@/app/[locale]/types";
import { getTranslation } from "@/i18n/server";

import { PreferencesPage } from "./preferences-page";

export default async function Page() {
  return <PreferencesPage />;
}

export async function generateMetadata(props: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getTranslation(params.locale);
  return {
    title: t("preferences"),
  };
}
