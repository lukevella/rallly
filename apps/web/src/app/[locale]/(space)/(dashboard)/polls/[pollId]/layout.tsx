import { buttonVariants } from "@rallly/ui";
import { Skeleton } from "@rallly/ui/skeleton";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Link } from "@/components/link";
import { PollProvider } from "@/features/poll/client";
import { PollAdminMenu } from "@/features/poll/components/poll-admin-menu";
import { PollPrimaryActions } from "@/features/poll/components/poll-primary-actions";
import { PollStatusBadge } from "@/features/poll/components/poll-status-badge";
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
      <h1 className="truncate font-semibold text-foreground">{poll.title}</h1>
      <PollStatusBadge status={poll.status} />
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
    // Grows with its content (no min-h-0) so the sticky header has the whole
    // page to stick within; the dashboard wrapper does the scrolling.
    <div className="flex flex-1 flex-col">
      {/* Fixed height (h-14 + h-10 = 6rem): Overview's cards stick at top-24
          to sit just below it. */}
      <header className="sticky top-0 z-10 shrink-0 bg-sidebar">
        <div className="flex h-14 items-center gap-2 px-4">
          <Link
            href="/polls"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <ArrowLeftIcon className="size-4" />
            <span className="sr-only">
              <Trans i18nKey="back" defaults="Back" />
            </span>
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Suspense fallback={<Skeleton className="h-5 w-40" />}>
              <PollPageTitle params={params} />
            </Suspense>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Suspense>
              <PollHeaderActions params={params} />
            </Suspense>
          </div>
        </div>
        <div className="flex h-10 items-center px-4">
          <PollShellTabs />
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
      <PollDetailSheet />
    </div>
  );
}
