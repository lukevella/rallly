import { Params } from "@/app/[locale]/types";
import { getTranslation } from "@/app/i18n";

import { BillingPage } from "./billing-page";

export default async function Page() {
  return <BillingPage />;
}

export async function generateMetadata({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("billing"),
  };
}
