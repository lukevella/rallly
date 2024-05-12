"use client";
import { Icon } from "@rallly/ui/icon";
import { ArrowUpRightIcon, UserCircle2Icon } from "lucide-react";
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
    <div className="flex gap-2.5 rounded-md border p-2.5 text-sm sm:items-center">
      <Icon>
        <UserCircle2Icon />
      </Icon>
      <div className="flex grow flex-col gap-x-2.5 sm:flex-row">
        <h4 className="font-semibold">
          <Trans i18nKey="eventHostTitle" defaults="Manage Access" />
        </h4>
        <p className="text-muted-foreground">
          <Trans
            i18nKey="eventHostDescription"
            defaults="You are the creator of this poll"
          />
        </p>
      </div>
      <Link
        className="text-link inline-flex items-center gap-x-2.5 lg:px-2.5"
        href={`/poll/${poll.id}`}
      >
        <Trans i18nKey="manage" />
        <Icon>
          <ArrowUpRightIcon />
        </Icon>
      </Link>
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
