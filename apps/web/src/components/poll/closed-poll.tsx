"use client";

import { Button } from "@rallly/ui/button";
import { Card } from "@rallly/ui/card";
import { LockIcon } from "lucide-react";
import * as React from "react";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { usePoll } from "@/contexts/poll";
import { Trans } from "@/i18n/client";

export function ClosedPoll({ children }: { children: React.ReactNode }) {
  const poll = usePoll();
  const [showOverlay, setShowOverlay] = React.useState(
    poll.status === "closed",
  );

  if (!showOverlay) {
    return <>{children}</>;
  }

  return (
    <Card>
      <EmptyState>
        <EmptyStateIcon>
          <LockIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>
          <Trans
            i18nKey="pollClosedTitle"
            defaults="This poll has been closed"
          />
        </EmptyStateTitle>
        <EmptyStateDescription>
          <Trans
            i18nKey="pollClosedDescription"
            defaults="No more responses are being accepted."
          />
        </EmptyStateDescription>
        <EmptyStateFooter>
          <Button onClick={() => setShowOverlay(false)}>
            <Trans i18nKey="viewResults" defaults="View results" />
          </Button>
        </EmptyStateFooter>
      </EmptyState>
    </Card>
  );
}
