import { buttonVariants } from "@rallly/ui";
import { Skeleton } from "@rallly/ui/skeleton";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageTitle,
} from "@/components/page-layout";
import { loadPoll } from "@/features/poll/loaders";
import { requireUser } from "@/features/user/loaders";
import { Trans } from "@/i18n/client";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { PollDetailSheet } from "./poll-detail-sheet";
import { PollOverflowMenu } from "./poll-overflow-menu";
import { PollShellTabs } from "./poll-shell-tabs";

async function PollPageTitle({
  params,
}: {
  params: Promise<{ pollId: string }>;
}) {
  const { pollId } = await params;
  const poll = await loadPoll(pollId);
  return poll.title;
}

async function PollShellMenu({
  params,
}: {
  params: Promise<{ pollId: string }>;
}) {
  const { pollId } = await params;
  const [poll, user] = await Promise.all([loadPoll(pollId), requireUser()]);

  return (
    <PollOverflowMenu
      pollId={poll.id}
      pollTitle={poll.title}
      status={poll.status}
      muted={poll.muted}
      canToggleNotifications={poll.userId === user.id}
    />
  );
}

export default function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ pollId: string }>;
}) {
  if (!isFeatureEnabled("pollAdmin")) {
    notFound();
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent className="flex items-center gap-2">
          <Link
            href="/polls"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <ArrowLeftIcon className="size-4" />
            <span className="sr-only">
              <Trans i18nKey="back" defaults="Back" />
            </span>
          </Link>
          <PageTitle>
            <Suspense fallback={<Skeleton className="h-5 w-40" />}>
              <PollPageTitle params={params} />
            </Suspense>
          </PageTitle>
        </PageHeaderContent>
        <PageHeaderActions>
          <Suspense fallback={<Skeleton className="size-9" />}>
            <PollShellMenu params={params} />
          </Suspense>
        </PageHeaderActions>
      </PageHeader>
      <PageContent>
        <PollShellTabs />
        <div className="mt-4 lg:mt-6">{children}</div>
      </PageContent>
      <PollDetailSheet />
    </PageContainer>
  );
}
