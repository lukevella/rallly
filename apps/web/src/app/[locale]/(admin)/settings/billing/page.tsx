import { getProPricing } from "@rallly/billing";

import { BillingPage } from "@/app/[locale]/(admin)/settings/billing/billing-page";
import { Params } from "@/app/[locale]/types";
import { getTranslation } from "@/app/i18n";

export default async function Page() {
  const prices = await getProPricing();
  return <BillingPage pricingData={prices} />;
}

export async function generateMetadata({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("billing"),
  };
}
