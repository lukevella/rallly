import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { getTranslation } from "@/i18n/server";
import { createPrivateSSRHelper } from "@/trpc/server/create-ssr-helper";
import { getBrowserTimeZone } from "@/utils/date-time-utils";
import { DashboardHome } from "./dashboard-home";

export default async function Page() {
  const helpers = await createPrivateSSRHelper();

  // On the server this resolves to the server's zone — the same value the SSR
  // pass of DashboardHome computes — so the suspense query hits the prefetched
  // cache instead of fetching during SSR. The client refetches with the real
  // browser zone after hydration when it differs.
  await helpers.dashboard.stats.prefetch({ timeZone: getBrowserTimeZone() });

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
