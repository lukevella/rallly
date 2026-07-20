"use client";
import { buttonVariants } from "@rallly/ui";
import { Alert, AlertAction, AlertDescription } from "@rallly/ui/alert";
import { ArrowUpRightIcon, CrownIcon } from "lucide-react";
import Link from "next/link";
import { usePoll } from "@/features/poll/client";
import Discussion from "@/features/poll/components/discussion";
import { EventCard } from "@/features/poll/components/event-card";
import { PollFooter } from "@/features/poll/components/poll-footer";
import { ResponsiveResults } from "@/features/poll/components/responsive-results";
import { VotingForm } from "@/features/poll/components/voting-form";
import { useUser } from "@/features/user/client";
import { Trans } from "@/i18n/client";

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
