import { buttonVariants } from "@rallly/ui";
import { Skeleton } from "@rallly/ui/skeleton";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Link } from "@/components/link";
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
      <h1 className="truncate font-semibold text-foreground">{poll.title}</h1>
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
    // Grows with its content (no min-h-0) so the sticky header has the whole
    // page to stick within; the dashboard wrapper does the scrolling.
    <div className="flex flex-1 flex-col">
      {/* One h-14 row from md up: title, tabs centred, actions. Equal 1fr
          side columns keep the tabs at the true centre whatever the title or
          actions widths. Overview's cards stick at top-14 to sit just below
          it. Below md the tabs wrap onto a second row. */}
      <header className="sticky top-0 z-10 flex shrink-0 flex-wrap items-center gap-x-2 bg-sidebar px-4 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="flex h-14 min-w-0 flex-1 items-center gap-2">
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
        </div>
        <div className="order-last flex h-10 w-full items-center md:order-none md:h-14 md:w-auto">
          <PollShellTabs />
        </div>
        <div className="flex h-14 shrink-0 items-center gap-2 md:justify-self-end">
          <Suspense>
            <PollHeaderActions params={params} />
          </Suspense>
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
      <PollDetailSheet />
    </div>
  );
}
