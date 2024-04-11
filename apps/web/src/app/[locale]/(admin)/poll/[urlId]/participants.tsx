import { Card, CardContent, CardHeader, CardTitle } from "@rallly/ui/card";
import { ShareIcon } from "lucide-react";
import React from "react";
import { Trans } from "react-i18next";
import { createBreakpoint } from "react-use";

import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/app/components/empty-state";
import { InviteDialog } from "@/components/invite-dialog";
import { useParticipants } from "@/components/participants-provider";
import DesktopPoll from "@/components/poll/desktop-poll";
import MobilePoll from "@/components/poll/mobile-poll";

const useBreakpoint = createBreakpoint({ list: 320, table: 640 });

export function ParticipantsCard() {
  const breakpoint = useBreakpoint();
  const PollComponent = breakpoint === "table" ? DesktopPoll : MobilePoll;
  const { participants } = useParticipants();
  if (participants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Trans i18nKey="participants" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState className="p-16">
            <EmptyStateIcon>
              <ShareIcon />
            </EmptyStateIcon>
            <EmptyStateTitle>
              <Trans i18nKey="noParticipants" defaults="No Participants" />
            </EmptyStateTitle>
            <EmptyStateDescription>
              <Trans
                i18nKey="noParticipantsDescription"
                defaults="Share the invite link with your participants to start gathering responses"
              />
            </EmptyStateDescription>
            <EmptyStateFooter>
              <InviteDialog />
            </EmptyStateFooter>
          </EmptyState>
        </CardContent>
      </Card>
    );
  }
  return <PollComponent />;
}
