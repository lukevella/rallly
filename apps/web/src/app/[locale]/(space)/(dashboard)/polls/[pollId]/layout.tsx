import { buttonVariants } from "@rallly/ui";
import { Skeleton } from "@rallly/ui/skeleton";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Link } from "@/components/link";
import {
  PageShell,
  PageShellContent,
  PageShellHeader,
  PageShellHeaderCenter,
  PageShellHeaderEnd,
  PageShellHeaderStart,
  PageShellTitle,
} from "@/components/page-shell";
import { PollProvider } from "@/features/poll/client";
import { PollAdminMenu } from "@/features/poll/components/poll-admin-menu";
import { PollPrimaryActions } from "@/features/poll/components/poll-primary-actions";
import { PollStatusIcon } from "@/features/poll/components/poll-status-icon";
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
  return (
    <>
      <PageShellTitle>{poll.title}</PageShellTitle>
      <PollStatusIcon status={poll.status} />
    </>
  );
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
      {poll.status === "scheduled" ? null : (
        <Link
          href={`/poll/${poll.id}/edit?from=admin`}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <PencilIcon className="size-4" />
          <span className="sr-only">
            <Trans i18nKey="edit" defaults="Edit" />
          </span>
        </Link>
      )}
      <PollPrimaryActions />
      <PollAdminMenu showEdit={false} />
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
      <PageShellHeader>
        <PageShellHeaderStart>
          <Link
            href="/polls"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <ArrowLeftIcon className="size-4" />
            <span className="sr-only">
              <Trans i18nKey="back" defaults="Back" />
            </span>
          </Link>
          <Suspense fallback={<Skeleton className="h-5 w-40" />}>
            <PollPageTitle params={params} />
          </Suspense>
        </PageShellHeaderStart>
        <PageShellHeaderCenter>
          <PollShellTabs />
        </PageShellHeaderCenter>
        <PageShellHeaderEnd>
          <Suspense>
            <PollHeaderActions params={params} />
          </Suspense>
        </PageShellHeaderEnd>
      </PageShellHeader>
      <PageShellContent>{children}</PageShellContent>
      <PollDetailSheet />
    </PageShell>
  );
}
