import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslation } from "@/i18n/server";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { createPrivateSSRHelper } from "@/trpc/server/create-ssr-helper";
import { BillingPageClient } from "./page-client";

export default async function BillingSettingsPage() {
  if (!isFeatureEnabled("billing")) {
    notFound();
  }

  const helpers = await createPrivateSSRHelper();

  await Promise.all([
    helpers.billing.getSubscription.prefetch(),
    helpers.spaces.seats.prefetch(),
  ]);

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <BillingPageClient />
    </HydrationBoundary>
  );
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
