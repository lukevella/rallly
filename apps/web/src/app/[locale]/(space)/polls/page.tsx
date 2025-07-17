import type { PollStatus } from "@rallly/database";
import { Button } from "@rallly/ui/button";
import { absoluteUrl, shortUrl } from "@rallly/utils/absolute-url";
import { InboxIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PollsPageHeader } from "@/app/[locale]/(space)/polls/components/header";
import { PageContainer, PageContent } from "@/app/components/page-layout";
import { CopyLinkButton } from "@/components/copy-link-button";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { ParticipantAvatarBar } from "@/components/participant-avatar-bar";
import { PollDateRange } from "@/components/poll-date-range";
import { StackedList, StackedListItem } from "@/components/stacked-list";
import { Trans } from "@/components/trans";
import { loadPolls } from "@/data/poll";
import { PollStatusIcon } from "@/features/poll/components/poll-status-icon";
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
      <PollsPageHeader />
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
                <StackedList>
                  {polls.map((poll) => {
                    const pollLink = absoluteUrl(`/poll/${poll.id}`);
                    const inviteLink = shortUrl(`/invite/${poll.id}`);
                    const { title, status, participants, dateRange } = poll;
                    return (
                      <StackedListItem key={poll.id}>
                        <div className="-m-4 relative flex min-w-0 flex-1 items-center gap-2 p-4">
                          <PollStatusIcon status={status} showTooltip={false} />
                          <div className="min-w-0 flex-1">
                            <Link
                              className="font-medium text-sm hover:underline focus:ring-ring focus-visible:ring-2"
                              href={pollLink}
                            >
                              <span className="absolute inset-0" />
                              <span className="block truncate">{title}</span>
                            </Link>
                          </div>
                          {dateRange && (
                            <PollDateRange
                              startDate={dateRange.startDate}
                              endDate={dateRange.endDate}
                              isFloating={dateRange.isFloating}
                              className="text-muted-foreground text-sm"
                            />
                          )}
                        </div>
                        <div className="flex items-center justify-end gap-4">
                          <div className="hidden sm:block">
                            <ParticipantAvatarBar
                              participants={participants}
                              max={5}
                            />
                          </div>
                          <CopyLinkButton href={inviteLink} />
                        </div>
                      </StackedListItem>
                    );
                  })}
                </StackedList>
                {totalPages > 1 ? (
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
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
