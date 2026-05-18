import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslation } from "@/i18n/server";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { createPrivateSSRHelper } from "@/trpc/server/create-ssr-helper";
import { EventTypesPage } from "./event-types-page";

export default async function Page() {
  if (!isFeatureEnabled("eventTypes")) {
    notFound();
  }

  const helpers = await createPrivateSSRHelper();
  await helpers.eventTypes.list.prefetch();

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <EventTypesPage />
    </HydrationBoundary>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("eventTypes", {
      defaultValue: "Event Types",
    }),
  };
}
