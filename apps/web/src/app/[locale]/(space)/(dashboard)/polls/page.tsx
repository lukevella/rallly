import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { loadPollStatusCounts } from "@/features/poll/loaders";
import { getTranslation } from "@/i18n/server";
import { createPrivateSSRHelper } from "@/trpc/server/create-ssr-helper";
import { PollsPage } from "./polls-page";

export default async function Page() {
  const helpers = await createPrivateSSRHelper();

  // The polls list itself is fetched on the client so switching filters shows
  // a skeleton instead of holding the previous list until the server responds.
  const [counts] = await Promise.all([
    loadPollStatusCounts(),
    helpers.spaces.listMembers.prefetch(),
  ]);

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <PollsPage counts={counts} />
    </HydrationBoundary>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("polls", {
      defaultValue: "Polls",
    }),
  };
}
