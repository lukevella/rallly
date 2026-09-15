"use client";
import { buttonVariants, cn } from "@rallly/ui";
import { Alert, AlertAction, AlertDescription } from "@rallly/ui/alert";
import { Card, CardHeader } from "@rallly/ui/card";
import { Skeleton } from "@rallly/ui/skeleton";
import { ArrowUpRightIcon, CrownIcon } from "lucide-react";
import { Link } from "@/components/link";
import { usePoll } from "@/features/poll/client";
import { CommentsSheet } from "@/features/poll/components/comments-sheet";
import { EventCard } from "@/features/poll/components/event-card";
import { PollFooter } from "@/features/poll/components/poll-footer";
import { ResponsiveResults } from "@/features/poll/components/responsive-results";
import {
  useVotingForm,
  VotingForm,
} from "@/features/poll/components/voting-form";
import { useUser } from "@/features/user/client";
import { Trans } from "@/i18n/client";
import { useHydrated } from "@/lib/datetime/use-hydrated";

const FloatingComments = () => {
  const votingForm = useVotingForm();
  const isVoting = votingForm.watch("mode") !== "view";

  return (
    <div
      className={cn(
        "fixed right-4 z-40 m-0 transition-[bottom] duration-300 ease-out lg:right-6 lg:bottom-6",
        // The mobile poll (below sm) shows a sticky voting footer while a
        // response is being edited; lift the button clear of it.
        isVoting ? "bottom-20 sm:bottom-4" : "bottom-4",
      )}
    >
      <CommentsSheet className="rounded-full shadow-lg" />
    </div>
  );
};

const GoToApp = () => {
  const poll = usePoll();
  const { user } = useUser();

  if (!user || user.id !== poll.userId) {
    return null;
  }

  return (
    <Alert variant="primary">
      <CrownIcon />
      <AlertDescription>
        <p>
          <Trans
            i18nKey="eventHostDescription"
            defaults="You are the creator of this poll"
          />
        </p>
      </AlertDescription>
      <AlertAction>
        <Link
          className={buttonVariants({ variant: "primary", size: "sm" })}
          href={`/poll/${poll.id}`}
          prefetch={false}
        >
          <Trans i18nKey="manage" defaults="Manage" />
          <ArrowUpRightIcon className="size-4" />
        </Link>
      </AlertAction>
    </Alert>
  );
};

function VotingInterfaceSkeleton() {
  return (
    <Card aria-busy="true">
      <CardHeader className="flex items-center gap-x-2.5 border-b">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-8 rounded-full" />
      </CardHeader>
      <div className="divide-y">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex h-12 items-center gap-x-3 px-4">
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * The voting grid depends on two things the server cannot know: the
 * viewer's zone and Intl output for the option dates, and the viewport
 * breakpoint that picks the desktop or mobile layout. It mounts after
 * hydration behind a placeholder of the same shape, while the rest of the
 * page arrives server-rendered.
 */
function VotingInterface() {
  const hydrated = useHydrated();

  if (!hydrated) {
    return <VotingInterfaceSkeleton />;
  }

  return (
    <VotingForm>
      <ResponsiveResults />
      <FloatingComments />
    </VotingForm>
  );
}

export function InvitePage({
  footerLinks,
}: {
  footerLinks: { label: string; href: string }[];
}) {
  return (
    <div className="page-bg-gray-100 h-dvh overflow-auto p-3 lg:p-6 dark:bg-gray-900">
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-4xl space-y-3"
      >
        <GoToApp />
        <EventCard />
        <VotingInterface />
        <PollFooter footerLinks={footerLinks} />
        <div className="h-24 lg:hidden" />
      </main>
    </div>
  );
}
