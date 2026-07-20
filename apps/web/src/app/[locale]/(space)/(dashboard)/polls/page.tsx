import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { getPollStatusCounts } from "@/features/poll/data";
import { getActiveSpace } from "@/features/space/data";
import { getTranslation } from "@/i18n/server";
import { createPrivateSSRHelper } from "@/trpc/server/create-ssr-helper";
import { PollsPage } from "./polls-page";
import { searchParamsSchema } from "./schema";

export default async function Page(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { status, q, member } = searchParamsSchema.parse(searchParams);

  const space = await getActiveSpace();
  const helpers = await createPrivateSSRHelper();

  const [counts] = await Promise.all([
    getPollStatusCounts({ spaceId: space.id }),
    helpers.spaces.listMembers.prefetch(),
    helpers.polls.infiniteChronological.prefetchInfinite({
      status,
      search: q,
      member,
    }),
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
