import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { getTranslation } from "@/i18n/server";
import { createPrivateSSRHelper } from "@/trpc/server/create-ssr-helper";
import { EventsPage } from "./events-page";

export default async function Page() {
  const helpers = await createPrivateSSRHelper();

  // The events list itself is fetched on the client: upcoming/past depends on
  // the viewer's clock and zone, which the server doesn't know.
  await helpers.spaces.listMembers.prefetch();

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <EventsPage />
    </HydrationBoundary>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("events", {
      defaultValue: "Events",
    }),
  };
}
