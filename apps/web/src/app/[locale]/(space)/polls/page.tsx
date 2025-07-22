import type { PollStatus } from "@rallly/database";
import { Button } from "@rallly/ui/button";
import { absoluteUrl, shortUrl } from "@rallly/utils/absolute-url";
import { InboxIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  PageContainer,
  PageContent,
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
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
import { PollList, PollListItem } from "@/features/poll/components/poll-list";
import { loadPolls } from "@/features/poll/data";
import { getTranslation } from "@/i18n/server";

import { SearchInput } from "../../../components/search-input";
import { PollsTabbedView } from "./polls-tabbed-view";
import { DEFAULT_PAGE_SIZE, searchParamsSchema } from "./schema";

// Combined schema for type inference
async function loadData({
  status = "live",
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  q,
}: {
  status?: PollStatus;
  page?: number;
  pageSize?: number;
  q?: string;
}) {
  const [{ total, data: polls }] = await Promise.all([
    loadPolls({ status, page, pageSize, q }),
  ]);

  return {
    polls,
    total,
  };
}

export async function generateMetadata(): Promise<Metadata> {
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
  const { t } = await getTranslation();

  const searchParams = await props.searchParams;
  const { status, page, pageSize, q } = searchParamsSchema.parse(searchParams);

  const { polls, total } = await loadData({
    status,
    page,
    pageSize,
    q,
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>
            <Trans i18nKey="polls" defaults="Polls" />
          </PageTitle>
        </PageHeaderContent>
        <PageHeaderActions>
          <Button variant="primary" asChild>
            <Link href="/new">
              <Trans i18nKey="create" defaults="Create" />
            </Link>
          </Button>
        </PageHeaderActions>
      </PageHeader>
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
                    currentPage={page}
                    totalItems={total}
                    pageSize={pageSize}
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
