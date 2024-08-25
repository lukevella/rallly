import { pricingData } from "@rallly/billing/pricing";
import { notFound } from "next/navigation";

import { BillingPage } from "@/app/[locale]/(admin)/settings/billing/billing-page";
import { Params } from "@/app/[locale]/types";
import { getTranslation } from "@/app/i18n";
import { env } from "@/env";

export default async function Page() {
  if (env.NEXT_PUBLIC_SELF_HOSTED === "true") {
    notFound();
  }
  return <BillingPage pricingData={pricingData} />;
}

export async function generateMetadata({ params }: { params: Params }) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("billing"),
  };
}
