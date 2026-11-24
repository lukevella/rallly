import { buttonVariants } from "@rallly/ui";
import { SidebarTrigger } from "@rallly/ui/sidebar";
import { Skeleton } from "@rallly/ui/skeleton";
import { ArrowLeftIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Link } from "@/components/link";
import {
  PageActions,
  PageContent,
  PageHeader,
  PageShell,
  PageToolbar,
} from "@/components/page";
import { PollProvider } from "@/features/poll/client";
import { PollAdminMenu } from "@/features/poll/components/poll-admin-menu";
import { PollPrimaryActions } from "@/features/poll/components/poll-primary-actions";
import { loadAdminPoll, loadPoll } from "@/features/poll/loaders";
import { Trans } from "@/i18n/client";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { PollDetailSheet } from "./poll-detail-sheet";
import { PollShellTabs } from "./poll-shell-tabs";

function TitleBar({ children }: React.PropsWithChildren) {
  return (
    <div className="flex h-16 items-end justify-between gap-4 pr-4 pb-1 pl-4">
      <div className="flex h-9 min-w-0 flex-1 items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        {children}
      </div>
    </div>
  );
}

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
  // from the poll provider.
  const { poll, participants, comments } = await loadAdminPoll(pollId);
  return (
    <PollProvider
      poll={poll}
      participants={participants}
      comments={comments}
      viewerRole="admin"
    >
      <PollAdminMenu />
      <PollPrimaryActions />
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
    <PageShell>
      <PageHeader>
        <TitleBar>
          <Link
            href="/polls"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <ArrowLeftIcon className="size-4" />
            <span className="sr-only">
              <Trans i18nKey="back" defaults="Back" />
            </span>
          </Link>
          <h1 className="truncate font-semibold text-foreground text-lg tracking-tight">
            <Suspense fallback={<Skeleton className="h-5 w-40" />}>
              <PollPageTitle params={params} />
            </Suspense>
          </h1>
          <PageActions>
            <Suspense>
              <PollHeaderActions params={params} />
            </Suspense>
          </PageActions>
        </TitleBar>
        <PageToolbar>
          <PollShellTabs />
        </PageToolbar>
      </PageHeader>
      <PageContent>{children}</PageContent>
      <PollDetailSheet />
    </PageShell>
  );
}
