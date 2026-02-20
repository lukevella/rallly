"use client";

import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { InboxIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageSkeleton,
  PageTitle,
} from "@/app/components/page-layout";
import { SearchInput } from "@/app/components/search-input";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { MemberSelector } from "@/components/member-selector";
import { PollsInfiniteList } from "@/features/poll/components/polls-infinite-list";
import { Trans, useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";
import { PollsTabbedView } from "./polls-tabbed-view";
import { searchParamsSchema } from "./schema";

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
        <Button asChild>
          <Link href="/new">
            <Trans i18nKey="createPoll" defaults="Create Poll" />
          </Link>
        </Button>
      </EmptyStateFooter>
    </EmptyState>
  );
}

function PollsPageContent() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [members] = trpc.space.members.useSuspenseQuery();

  const { status, q, member } = searchParamsSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );

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
              <Icon>
                <PlusIcon />
              </Icon>
              <Trans i18nKey="newPoll" defaults="New Poll" />
            </Link>
          </Button>
        </PageHeaderActions>
      </PageHeader>
      <PageContent>
        <PollsTabbedView>
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
            emptyState={<PollsEmptyState />}
          />
        </PollsTabbedView>
      </PageContent>
    </PageContainer>
  );
}

export function PollsPage() {
  return (
    <React.Suspense fallback={<PageSkeleton />}>
      <PollsPageContent />
    </React.Suspense>
  );
}
