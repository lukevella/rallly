import { buttonVariants } from "@rallly/ui";
import { Skeleton } from "@rallly/ui/skeleton";
import { ArrowLeftIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Link } from "@/components/link";
import {
  ListView,
  ListViewActions,
  ListViewContent,
  ListViewHeader,
  ListViewTitle,
  ListViewTitleBar,
  ListViewToolbar,
} from "@/components/list-view";
import { PollProvider } from "@/features/poll/client";
import { PollAdminMenu } from "@/features/poll/components/poll-admin-menu";
import { LegacyPollContextProvider } from "@/features/poll/components/poll-context-provider";
import { PollPrimaryActions } from "@/features/poll/components/poll-primary-actions";
import { loadAdminPoll, loadPoll } from "@/features/poll/loaders";
import { Trans } from "@/i18n/client";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { PollDetailSheet } from "./poll-detail-sheet";
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

async function PollHeaderActions({
  params,
}: {
  params: Promise<{ pollId: string }>;
}) {
  const { pollId } = await params;
  await loadPoll(pollId);
  // The finalize dialog and CSV export read the whole poll, votes included,
  // from the poll context the legacy admin page provides.
  const { poll, participants, comments } = await loadAdminPoll(pollId);
  return (
    <PollProvider
      poll={poll}
      participants={participants}
      comments={comments}
      viewerRole="admin"
    >
      <LegacyPollContextProvider>
        <PollAdminMenu />
        <PollPrimaryActions />
      </LegacyPollContextProvider>
    </PollProvider>
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
    <ListView>
      <ListViewHeader>
        <ListViewTitleBar className="md:pl-4">
          <Link
            href="/polls"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <ArrowLeftIcon className="size-4" />
            <span className="sr-only">
              <Trans i18nKey="back" defaults="Back" />
            </span>
          </Link>
          <ListViewTitle>
            <Suspense fallback={<Skeleton className="h-5 w-40" />}>
              <PollPageTitle params={params} />
            </Suspense>
          </ListViewTitle>
          <ListViewActions>
            <Suspense>
              <PollHeaderActions params={params} />
            </Suspense>
          </ListViewActions>
        </ListViewTitleBar>
        <ListViewToolbar>
          <PollShellTabs />
        </ListViewToolbar>
      </ListViewHeader>
      <ListViewContent>{children}</ListViewContent>
      <PollDetailSheet />
    </ListView>
  );
}
