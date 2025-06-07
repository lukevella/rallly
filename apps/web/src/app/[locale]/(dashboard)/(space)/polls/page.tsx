import type { PollStatus } from "@rallly/database";
import { Button } from "@rallly/ui/button";
import { absoluteUrl, shortUrl } from "@rallly/utils/absolute-url";
import { InboxIcon } from "lucide-react";
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
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { Trans } from "@/components/trans";
import { getPolls } from "@/features/poll/api/get-polls";
import { PollList, PollListItem } from "@/features/poll/components/poll-list";
import { getTranslation } from "@/i18n/server";
import { requireUser } from "@/next-auth";

import { SearchInput } from "@/app/components/search-input";
import { PollsTabbedView } from "./polls-tabbed-view";

const DEFAULT_PAGE_SIZE = 10;

const pageSchema = z
  .string()
  .nullish()
  .transform((val) => {
    if (!val) return 1;
    const parsed = Number.parseInt(val, 10);
    return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
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
    const parsed = Number.parseInt(val, 10);
    return Number.isNaN(parsed) || parsed < 1
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
  const [{ total, data: polls }] = await Promise.all([
    getPolls({ userId, status, page, pageSize, q }),
  ]);

  return {
    polls,
    total,
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

function PollsEmptyState() {
  return (
    <EmptyState className="p-8">
      <EmptyStateIcon>
        <InboxIcon />
      </EmptyStateIcon>
      <EmptyStateTitle>
        <Trans i18nKey="noPolls" defaults="No polls found" />
      </EmptyStateTitle>
      <EmptyStateDescription>
        <Trans
          i18nKey="noPollsDescription"
          defaults="Try adjusting your search or create a new poll"
        />
      </EmptyStateDescription>
      <EmptyStateFooter>
        <Button variant="primary" asChild>
          <Link href="/new">
            <Trans i18nKey="createPoll" defaults="Create Poll" />
          </Link>
        </Button>
      </EmptyStateFooter>
    </EmptyState>
  );
}

export default async function Page(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { t } = await getTranslation();
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
        <SearchInput
          placeholder={t("searchPollsPlaceholder", {
            defaultValue: "Search polls by title...",
          })}
        />
        <PollsTabbedView>
          <div className="space-y-4">
            {polls.length === 0 ? (
              <PollsEmptyState />
            ) : (
              <>
                <PollList>
                  {polls.map((poll) => (
                    <PollListItem
                      key={poll.id}
                      title={poll.title}
                      status={poll.status}
                      participants={poll.participants}
                      pollLink={absoluteUrl(`/poll/${poll.id}`)}
                      inviteLink={shortUrl(`/invite/${poll.id}`)}
                    />
                  ))}
                </PollList>
                {totalPages > 1 ? (
                  <Pagination
                    currentPage={parsedPage}
                    totalPages={totalPages}
                    totalItems={total}
                    pageSize={parsedPageSize}
                    className="mt-4"
                  />
                ) : null}
              </>
            )}
          </div>
        </PollsTabbedView>
      </PageContent>
    </PageContainer>
  );
}
