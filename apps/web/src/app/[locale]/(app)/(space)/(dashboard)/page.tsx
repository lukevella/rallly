import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { getTranslation } from "@/i18n/server";
import { createAuthenticatedSSRHelper } from "@/trpc/server/create-ssr-helper";
import { DashboardHome } from "./dashboard-home";

export default async function Page() {
  const helpers = await createAuthenticatedSSRHelper();

  await helpers.dashboard.stats.prefetch();

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <DashboardHome />
    </HydrationBoundary>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("home", {
      defaultValue: "Home",
    }),
  };
}
