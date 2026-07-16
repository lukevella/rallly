"use client";
import { Alert, AlertDescription } from "@rallly/ui/alert";
import { ArrowUpRightIcon, CrownIcon } from "lucide-react";
import Link from "next/link";
import { usePoll } from "@/features/poll/client";
import Discussion from "@/features/poll/components/discussion";
import { EventCard } from "@/features/poll/components/event-card";
import { PollFooter } from "@/features/poll/components/poll-footer";
import { ResponsiveResults } from "@/features/poll/components/responsive-results";
import { VotingForm } from "@/features/poll/components/voting-form";
import { Trans } from "@/i18n/client";
import { trpc } from "@/trpc/client";

const GoToApp = () => {
  const poll = usePoll();
  const { data: user } = trpc.user.getMe.useQuery();

  if (!user || user.id !== poll.userId) {
    return null;
  }

  return (
    <Alert variant="primary">
      <CrownIcon />
      <AlertDescription>
        <div className="flex w-full flex-1 items-center gap-2">
          <p className="flex-1">
            <Trans
              i18nKey="eventHostDescription"
              defaults="You are the creator of this poll"
            />
          </p>
          <div>
            <Link
              className="inline-flex items-center gap-2 hover:underline"
              href={`/poll/${poll.id}`}
              prefetch={false}
            >
              <Trans i18nKey="manage" defaults="Manage" />
              <ArrowUpRightIcon className="size-4" />
            </Link>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export function InvitePage() {
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
        </VotingForm>
        <Discussion />
        <PollFooter />
      </main>
    </div>
  );
}
