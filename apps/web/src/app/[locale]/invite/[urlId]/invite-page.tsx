"use client";
import { Button } from "@rallly/ui/button";
import { ArrowUpLeftIcon } from "lucide-react";
import Link from "next/link";

import Discussion from "@/components/discussion";
import { EventCard } from "@/components/event-card";
import { PollFooter } from "@/components/poll/poll-footer";
import { PollHeader } from "@/components/poll/poll-header";
import { ResponsiveResults } from "@/components/poll/responsive-results";
import { useTouchBeacon } from "@/components/poll/use-touch-beacon";
import { VotingForm } from "@/components/poll/voting-form";
import { ScheduledEvent } from "@/components/scheduled-event";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { usePoll } from "@/contexts/poll";

const GoToApp = () => {
  const poll = usePoll();
  const { user } = useUser();
  if (poll.userId !== user.id) {
    return null;
  }

  return (
    <div className="flex justify-between gap-x-4">
      <div>
        <Button variant="ghost" asChild>
          <Link href={`/poll/${poll.id}`}>
            <ArrowUpLeftIcon className="text-muted-foreground size-4" />
            <Trans i18nKey="manage" />
          </Link>
        </Button>
      </div>
    </div>
  );
};

export function InvitePage() {
  useTouchBeacon();
  return (
    <div className="mx-auto max-w-4xl space-y-3 p-3 lg:space-y-4 lg:px-4 lg:py-8">
      <PollHeader />
      <GoToApp />
      <EventCard />
      <ScheduledEvent />
      <VotingForm>
        <ResponsiveResults />
      </VotingForm>
      <Discussion />
      <PollFooter />
    </div>
  );
}
