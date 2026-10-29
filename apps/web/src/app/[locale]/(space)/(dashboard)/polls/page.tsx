import type { Metadata } from "next";
import { Suspense } from "react";
import { PollsList } from "@/features/poll/components/polls-list";
import { OpenPollUsageMeter } from "@/features/poll/limit/components/open-poll-usage-meter";
import { loadOptionalOpenPollUsage } from "@/features/poll/limit/loaders";
import { loadPollStatusCounts, loadPolls } from "@/features/poll/loaders";
import { loadActiveSpace } from "@/features/space/loaders";
import { loadSpaceMembers } from "@/features/space/member/loaders";
import { getTranslation } from "@/i18n/server";
import {
  NoOpenPollsEmptyState,
  PollsEmptyState,
  PollsPage,
} from "./polls-page";
import { searchParamsSchema } from "./schema";

async function OpenPollUsageSlot() {
  const usage = await loadOptionalOpenPollUsage();
  return usage ? <OpenPollUsageMeter usage={usage} /> : null;
}

export default async function Page(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [space, searchParams] = await Promise.all([
    loadActiveSpace(),
    props.searchParams,
  ]);
  const { status, q, member, page, pageSize } =
    searchParamsSchema.parse(searchParams);
  // Ignore a member URL param when the filter is hidden — a bookmarked
  // ?member= URL would otherwise show an empty list with no visible
  // control to clear it.
  const visibleMember = space.shared ? member : undefined;

  const [counts, members, result] = await Promise.all([
    loadPollStatusCounts(),
    loadSpaceMembers(),
    loadPolls({ status, q, member: visibleMember, page, pageSize }),
  ]);

  const hasFilters = Boolean(q || visibleMember);
  const showClosedPollsPointer =
    status === "open" && !hasFilters && counts.closed > 0;

  return (
    <PollsPage
      members={members.map(({ userId, name, image }) => ({
        userId,
        name,
        image,
      }))}
      usageMeter={
        <Suspense fallback={null}>
          <OpenPollUsageSlot />
        </Suspense>
      }
      list={
        <PollsList
          polls={result.polls}
          emptyState={
            showClosedPollsPointer ? (
              <NoOpenPollsEmptyState closedCount={counts.closed} />
            ) : (
              <PollsEmptyState />
            )
          }
        />
      }
      page={page}
      hasNextPage={result.hasNextPage}
    />
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
