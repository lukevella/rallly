import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslation } from "@/i18n/server";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { createPrivateSSRHelper } from "@/trpc/server/create-ssr-helper";
import { SheetsPage } from "./sheets-page";

export default async function Page() {
  if (!isFeatureEnabled("signupSheets")) {
    notFound();
  }

  const helpers = await createPrivateSSRHelper();
  await helpers.sheets.list.prefetch();

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <SheetsPage />
    </HydrationBoundary>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("sheets", {
      defaultValue: "Sheets",
    }),
  };
}
