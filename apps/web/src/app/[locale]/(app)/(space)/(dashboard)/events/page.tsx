import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { getTranslation } from "@/i18n/server";
import { createPrivateSSRHelper } from "@/trpc/server/create-ssr-helper";
import { EventsPage } from "./events-page";
import { eventsSearchParamsSchema } from "./schema";

export default async function Page(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { status, q, member } = eventsSearchParamsSchema.parse(searchParams);

  const helpers = await createPrivateSSRHelper();

  await Promise.all([
    helpers.spaces.listMembers.prefetch(),
    helpers.events.infiniteList.prefetchInfinite({
      status,
      search: q,
      member,
    }),
  ]);

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
