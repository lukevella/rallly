import type { PollStatus } from "@rallly/database";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { InboxIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PollsTabbedView } from "@/app/[locale]/(space)/(dashboard)/polls/polls-tabbed-view";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
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
import { Trans } from "@/components/trans";
import { PollsInfiniteList } from "@/features/poll/components/polls-infinite-list";
import { loadMembers } from "@/features/space/data";
import { getTranslation } from "@/i18n/server";
import { createSSRHelper } from "@/trpc/server/create-ssr-helper";
import { searchParamsSchema } from "./schema";

async function loadData({
  status,
  q,
  member,
}: {
  status?: PollStatus;
  q?: string;
  member?: string;
}) {
  const helpers = await createSSRHelper();

  const [members] = await Promise.all([
    loadMembers(),
    helpers.polls.infiniteChronological.prefetchInfinite({
      status,
      search: q,
      member,
    }),
  ]);

  return {
    members,
    dehydratedState: dehydrate(helpers.queryClient),
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
        <Button asChild>
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
  const { status, q, member } = searchParamsSchema.parse(searchParams);

  const { members, dehydratedState } = await loadData({
    status,
    q,
    member,
  });

  return (
    <HydrationBoundary state={dehydratedState}>
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
              <MemberSelector members={members.data} />
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
    </HydrationBoundary>
  );
}
