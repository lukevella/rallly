"use client";

import { buttonVariants } from "@rallly/ui";
import { CircleStopIcon, InboxIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { MemberSelector } from "@/components/member-selector";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageTitle,
} from "@/components/page-layout";
import { SearchInput } from "@/components/search-input";
import { PollsInfiniteList } from "@/features/poll/components/polls-infinite-list";
import type { PollStatus } from "@/features/poll/schema";
import { Trans, useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";
import { PollsTabbedView } from "./polls-tabbed-view";
import { searchParamsSchema } from "./schema";

function NoOpenPollsEmptyState({ closedCount }: { closedCount: number }) {
  return (
    <EmptyState className="h-96">
      <EmptyStateIcon>
        <CircleStopIcon />
      </EmptyStateIcon>
      <EmptyStateTitle>
        <Trans i18nKey="noOpenPolls" defaults="No open polls" />
      </EmptyStateTitle>
      <EmptyStateDescription>
        <Trans
          i18nKey="noOpenPollsDescription"
          defaults="Polls close automatically once all of their dates have passed. You have {count, plural, one {1 closed poll} other {# closed polls}}."
          values={{ count: closedCount }}
        />
      </EmptyStateDescription>
      <EmptyStateFooter className="flex flex-wrap justify-center gap-2">
        <Link
          href="?status=closed"
          className={buttonVariants({ variant: "primary" })}
        >
          <Trans i18nKey="viewClosedPolls" defaults="View closed polls" />
        </Link>
        <Link href="/new" className={buttonVariants()}>
          <Trans i18nKey="createPoll" defaults="Create Poll" />
        </Link>
      </EmptyStateFooter>
    </EmptyState>
  );
}

function PollsEmptyState() {
  return (
    <EmptyState className="h-96">
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
        <Link href="/new" className={buttonVariants()}>
          <Trans i18nKey="createPoll" defaults="Create Poll" />
        </Link>
      </EmptyStateFooter>
    </EmptyState>
  );
}

export function PollsPage({ counts }: { counts: Record<PollStatus, number> }) {
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [{ data: members }] = trpc.spaces.listMembers.useSuspenseQuery();

  const { status, q, member } = searchParamsSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );

  const hasFilters = Boolean(q || member);
  const showClosedPollsPointer =
    status === "open" && !hasFilters && counts.closed > 0;

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>
            <Trans i18nKey="polls" defaults="Polls" />
          </PageTitle>
        </PageHeaderContent>
        <PageHeaderActions>
          <Link href="/new" className={buttonVariants({ variant: "primary" })}>
            <PlusIcon data-icon="inline-start" />
            <Trans i18nKey="newPoll" defaults="New Poll" />
          </Link>
        </PageHeaderActions>
      </PageHeader>
      <PageContent>
        <PollsTabbedView counts={counts}>
          <div className="mb-6 flex gap-x-2">
            <SearchInput
              placeholder={t("searchPollsPlaceholder", {
                defaultValue: "Search polls by title...",
              })}
            />
            <MemberSelector members={members} />
          </div>
          <PollsInfiniteList
            status={status}
            search={q}
            member={member}
            emptyState={
              showClosedPollsPointer ? (
                <NoOpenPollsEmptyState closedCount={counts.closed} />
              ) : (
                <PollsEmptyState />
              )
            }
          />
        </PollsTabbedView>
      </PageContent>
    </PageContainer>
  );
}
