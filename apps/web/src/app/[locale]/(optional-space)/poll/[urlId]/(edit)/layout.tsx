"use client";
import { buttonVariants } from "@rallly/ui";
import { Card } from "@rallly/ui/card";
import { CalendarCheck2Icon } from "lucide-react";
import type React from "react";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { Link } from "@/components/link";
import { usePoll } from "@/features/poll/client";
import { Trans } from "@/i18n/client";

// A booked event keeps its own copy of the poll's details, so edits made after
// booking would never reach it. The server rejects them too; this covers deep
// links to the edit pages.
export default function Layout({ children }: { children: React.ReactNode }) {
  const poll = usePoll();

  if (poll.status !== "scheduled") {
    return children;
  }

  return (
    <Card>
      <EmptyState>
        <EmptyStateIcon>
          <CalendarCheck2Icon />
        </EmptyStateIcon>
        <EmptyStateTitle>
          <Trans
            i18nKey="scheduledPollLockedTitle"
            defaults="This poll is scheduled"
          />
        </EmptyStateTitle>
        <EmptyStateDescription>
          <Trans
            i18nKey="scheduledPollLockedDescription"
            defaults="A scheduled poll can no longer be edited."
          />
        </EmptyStateDescription>
        <EmptyStateFooter>
          <Link href={`/poll/${poll.id}`} className={buttonVariants()}>
            <Trans i18nKey="backToPoll" defaults="Back to poll" />
          </Link>
        </EmptyStateFooter>
      </EmptyState>
    </Card>
  );
}
