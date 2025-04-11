import type { PollStatus, Prisma } from "@rallly/database";
import { Button } from "@rallly/ui/button";
import { shortUrl } from "@rallly/utils/absolute-url";
import Link from "next/link";
import { z } from "zod";

import { PollPageIcon } from "@/app/components/page-icons";
import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { CopyLinkButton } from "@/components/copy-link-button";
import { Pagination } from "@/components/pagination";
import { ParticipantAvatarBar } from "@/components/participant-avatar-bar";
import { PollStatusIcon } from "@/components/poll-status-icon";
import {
  StackedList,
  StackedListItem,
  StackedListItemContent,
} from "@/components/stacked-list";
import { Trans } from "@/components/trans";
import { getPollCountByStatus } from "@/data/get-poll-count-by-status";
import { getPolls } from "@/data/get-polls";
import { getTranslation } from "@/i18n/server";
import { requireUser } from "@/next-auth";

import { PollsTabbedView } from "./polls-tabbed-view";
import { SearchInput } from "./search-input";

const DEFAULT_PAGE_SIZE = 20;

const pageSchema = z
  .string()
  .nullish()
  .transform((val) => {
    if (!val) return 1;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  });

const querySchema = z
  .string()
  .nullish()
  .transform((val) => val?.trim() || undefined);

const statusSchema = z
  .enum(["live", "paused", "finalized"])
  .nullish()
  .transform((val) => val || "live");

const pageSizeSchema = z
  .string()
  .nullish()
  .transform((val) => {
    if (!val) return DEFAULT_PAGE_SIZE;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) || parsed < 1
      ? DEFAULT_PAGE_SIZE
      : Math.min(parsed, 100);
  });

// Combined schema for type inference
async function loadData({
  userId,
  status = "live",
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  q,
}: {
  userId: string;
  status?: PollStatus;
  page?: number;
  pageSize?: number;
  q?: string;
}) {
  // Build the where clause based on filters
  const where: Prisma.PollWhereInput = {
    userId,
    status,
  };

  // Add search filter if provided
  if (q) {
    where.title = {
      contains: q,
      mode: "insensitive",
    };
  }

  // Count total polls for pagination and folder counts
  const [{ total, data: polls }, statusCounts] = await Promise.all([
    getPolls({ userId, status, page, pageSize, q }),
    getPollCountByStatus(userId),
  ]);

  return {
    polls,
    total,
    statusCounts,
  };
}

export async function generateMetadata() {
  const { t } = await getTranslation();
  return {
    title: t("polls", {
      defaultValue: "Polls",
    }),
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { userId } = await requireUser();

  const parsedStatus = statusSchema.parse(searchParams.status);
  const parsedPage = pageSchema.parse(searchParams.page);
  const parsedPageSize = pageSizeSchema.parse(searchParams.pageSize);
  const parsedQuery = querySchema.parse(searchParams.q);

  const { polls, total } = await loadData({
    userId,
    status: parsedStatus,
    page: parsedPage,
    pageSize: parsedPageSize,
    q: parsedQuery,
  });

  const totalPages = Math.ceil(total / parsedPageSize);

  return (
    <PageContainer>
      <div className="flex gap-4">
        <PageHeader className="flex-1">
          <PageTitle>
            <PollPageIcon />
            <Trans i18nKey="polls" defaults="Polls" />
          </PageTitle>
          <PageDescription>
            <Trans
              i18nKey="pollsPageDesc"
              defaults="View and manage all your scheduling polls"
            />
          </PageDescription>
        </PageHeader>
        <div className="flex items-start gap-2">
          <Button size="sm" asChild>
            <Link href="/new">
              <Trans i18nKey="create" defaults="Create" />
            </Link>
          </Button>
        </div>
      </div>
      <PageContent className="space-y-4">
        <PollsTabbedView>
          <div className="space-y-4">
            <SearchInput />
            <StackedList className="overflow-hidden">
              {polls.map((poll) => (
                <StackedListItem
                  className="relative hover:bg-gray-50"
                  key={poll.id}
                >
                  <div className="flex items-center gap-4">
                    <StackedListItemContent className="relative flex min-w-0 flex-1 items-center gap-2">
                      <PollStatusIcon status={poll.status} />
                      <Link
                        className="focus:ring-ring truncate text-sm font-medium hover:underline focus-visible:ring-2"
                        href={`/poll/${poll.id}`}
                      >
                        <span className="absolute inset-0" />
                        {poll.title}
                      </Link>
                    </StackedListItemContent>
                    <StackedListItemContent className="z-10 hidden items-center justify-end gap-4 sm:flex">
                      <ParticipantAvatarBar
                        participants={poll.participants}
                        max={5}
                      />
                      <CopyLinkButton href={shortUrl(`/invite/${poll.id}`)} />
                    </StackedListItemContent>
                  </div>
                </StackedListItem>
              ))}
            </StackedList>
            {polls.length > 0 ? (
              <Pagination
                currentPage={parsedPage}
                totalPages={totalPages}
                totalItems={total}
                pageSize={parsedPageSize}
                className="mt-4"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-lg font-medium">
                  <Trans i18nKey="noPolls" defaults="No polls found" />
                </p>
                <p className="text-muted-foreground mt-1">
                  <Trans
                    i18nKey="noPollsDescription"
                    defaults="Try adjusting your search or create a new poll"
                  />
                </p>
                <Button variant="primary" className="mt-4" asChild>
                  <Link href="/new">
                    <Trans i18nKey="createPoll" defaults="Create Poll" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </PollsTabbedView>
      </PageContent>
    </PageContainer>
  );
}
