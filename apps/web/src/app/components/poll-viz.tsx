"use client";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { Card, CardHeader, CardTitle } from "@rallly/ui/card";
import { FormField } from "@rallly/ui/form";
import { Icon } from "@rallly/ui/icon";
import { PlusIcon } from "lucide-react";
import React from "react";

import { useParticipants } from "@/components/participants-provider";
import DesktopPoll from "@/components/poll/desktop-poll";
import MobilePoll from "@/components/poll/mobile-poll";
import { useVotingForm, VotingForm } from "@/components/poll/voting-form";
import { Trans } from "@/components/trans";
import { usePermissions } from "@/contexts/permissions";

function AddParticipantButton() {
  const form = useVotingForm();
  const { canAddNewParticipant } = usePermissions();

  if (!canAddNewParticipant) {
    return null;
  }

  return (
    <FormField
      control={form.control}
      name="mode"
      render={({ field }) => {
        return (
          <Button
            disabled={field.value === "new"}
            className={field.value === "new" ? "hidden" : ""}
            size="sm"
            onClick={() => {
              form.newParticipant();
            }}
          >
            <Icon>
              <PlusIcon />
            </Icon>
          </Button>
        );
      }}
    />
  );
}

const checkIfWideScreen = () => window.innerWidth > 640;

export function PollComp() {
  React.useEffect(() => {
    const listener = () => setIsWideScreen(checkIfWideScreen());

    window.addEventListener("resize", listener);

    return () => {
      window.removeEventListener("resize", listener);
    };
  }, []);

  const [isWideScreen, setIsWideScreen] = React.useState(checkIfWideScreen);
  const PollComponent = isWideScreen ? DesktopPoll : MobilePoll;

  return <PollComponent />;
}
export function PollViz() {
  const { participants } = useParticipants();
  return (
    <VotingForm>
      <Card>
        <CardHeader className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-x-2.5">
            <CardTitle>
              <Trans i18nKey="participants" />
            </CardTitle>
            <Badge>{participants.length}</Badge>
            <AddParticipantButton />
          </div>
        </CardHeader>
        <PollComp />
        {/* {participants.length > 0 ? (
          <PollComponent />
        ) : (
          <CardContent>
            <EmptyState className="p-16">
              <EmptyStateIcon>
                <UsersIcon />
              </EmptyStateIcon>
              <EmptyStateTitle>No Participants</EmptyStateTitle>
              <EmptyStateDescription>
                Your poll has no participants yet
              </EmptyStateDescription>
              <EmptyStateFooter>
                <InviteDialog />
              </EmptyStateFooter>
            </EmptyState>
          </CardContent>
        )} */}
      </Card>
    </VotingForm>
  );
}
