"use client";
import { Alert, AlertDescription } from "@rallly/ui/alert";
import { ArrowUpRightIcon, CrownIcon } from "lucide-react";
import Link from "next/link";
import Discussion from "@/components/discussion";
import { EventCard } from "@/components/event-card";
import { PollFooter } from "@/components/poll/poll-footer";
import { PollViewTracker } from "@/components/poll/poll-view-tracker";
import { ResponsiveResults } from "@/components/poll/responsive-results";
import { VotingForm } from "@/components/poll/voting-form";
import { usePoll } from "@/contexts/poll";
import { Trans } from "@/i18n/client";
import { authClient } from "@/lib/auth-client";

const GoToApp = () => {
  const poll = usePoll();
  const { data: session } = authClient.useSession();

  if (!session || session.user.id !== poll.userId) {
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
  const poll = usePoll();

  return (
    <div className="page-bg-gray-100 h-dvh overflow-auto p-3 lg:p-6 dark:bg-gray-900">
      <PollViewTracker pollId={poll.id} />
      <div className="mx-auto w-full max-w-4xl space-y-3">
        <GoToApp />
        <EventCard />
        <VotingForm>
          <ResponsiveResults />
        </VotingForm>
        <Discussion />
        <PollFooter />
      </div>
    </div>
  );
}
