import { Badge } from "@rallly/ui/badge";
import { Card, CardHeader, CardTitle } from "@rallly/ui/card";
import { UserPlusIcon } from "lucide-react";
import { Trans } from "react-i18next";
import { createBreakpoint } from "react-use";

import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/app/components/empty-state";
import { InviteDialog } from "@/components/invite-dialog";
import { useParticipants } from "@/components/participants-provider";
import DesktopPoll from "@/components/poll/desktop-poll";
import MobilePoll from "@/components/poll/mobile-poll";
import { VotingForm } from "@/components/poll/voting-form";

const useBreakpoint = createBreakpoint({ list: 320, table: 640 });

export function ParticipantsInner() {
  const breakpoint = useBreakpoint();
  const PollComponent = breakpoint === "table" ? DesktopPoll : MobilePoll;
  const { participants } = useParticipants();
  if (participants.length === 0) {
    return (
      <EmptyState className="p-16">
        <EmptyStateIcon>
          <UserPlusIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>
          <Trans i18nKey="noParticipants" defaults="No Participants" />
        </EmptyStateTitle>
        <EmptyStateDescription>
          <Trans i18nKey="noParticipantsDescription" />
        </EmptyStateDescription>
      </EmptyState>
    );
  }
  return (
    <VotingForm>
      <PollComponent />
    </VotingForm>
  );
}

export function Participants() {
  const { participants } = useParticipants();
  return (
    <Card>
      <CardHeader className="flex justify-between">
        <div className="flex items-center gap-x-2.5">
          <CardTitle>
            <Trans i18nKey="participants" />
          </CardTitle>
          <Badge>{participants.length}</Badge>
        </div>
        <InviteDialog />
      </CardHeader>
      <ParticipantsInner />
    </Card>
  );
}
