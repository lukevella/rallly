"use client";
import { buttonVariants, cn } from "@rallly/ui";
import { Alert, AlertAction, AlertDescription } from "@rallly/ui/alert";
import { ArrowUpRightIcon, CrownIcon } from "lucide-react";
import Link from "next/link";
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
        <VotingForm>
          <ResponsiveResults />
          <FloatingComments />
        </VotingForm>
        <PollFooter footerLinks={footerLinks} />
        <div className="h-24 lg:hidden" />
      </main>
    </div>
  );
}
