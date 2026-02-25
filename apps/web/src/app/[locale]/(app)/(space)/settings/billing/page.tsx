import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslation } from "@/i18n/server";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { BillingPageClient } from "./page-client";

export default function BillingSettingsPage() {
  if (!isFeatureEnabled("billing")) {
    notFound();
  }

  return <BillingPageClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("billingSettings", {
      defaultValue: "Billing Settings",
    }),
    description: t("billingSettingsDescription", {
      defaultValue:
        "View and manage your space's subscription and billing information.",
    }),
  };
}
