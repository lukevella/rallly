import { pricingData } from "@rallly/billing/pricing";
import { notFound } from "next/navigation";

import { BillingPage } from "@/app/[locale]/(admin)/settings/billing/billing-page";
import type { Params } from "@/app/[locale]/types";
import { env } from "@/env";
import { getTranslation } from "@/i18n/server";

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
