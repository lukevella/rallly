"use client";
import { Alert, AlertDescription } from "@rallly/ui/alert";
import { ArrowUpRightIcon, CrownIcon } from "lucide-react";
import Link from "next/link";
import Discussion from "@/components/discussion";
import { EventCard } from "@/components/event-card";
import { PollFooter } from "@/components/poll/poll-footer";
import { PollViewTracker } from "@/components/poll/poll-view-tracker";
import { ResponsiveResults } from "@/components/poll/responsive-results";
import { ScheduledEvent } from "@/components/poll/scheduled-event";
import { VotingForm } from "@/components/poll/voting-form";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { usePoll } from "@/contexts/poll";

const GoToApp = () => {
  const poll = usePoll();
  const { ownsObject } = useUser();
  if (!ownsObject(poll)) {
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
              className="inline-flex items-center gap-2 text-primary hover:underline"
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
    <div className="absolute inset-0 overflow-auto bg-gray-100 p-3 sm:p-6">
      <PollViewTracker pollId={poll.id} />
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <GoToApp />
        <EventCard />
        <ScheduledEvent />
        <VotingForm>
          <ResponsiveResults />
        </VotingForm>
        <Discussion />
        <PollFooter />
      </div>
    </div>
  );
}
