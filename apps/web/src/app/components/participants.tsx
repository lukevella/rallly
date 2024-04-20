"use client";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { Card, CardHeader, CardTitle } from "@rallly/ui/card";
import { FormField } from "@rallly/ui/form";
import { Icon } from "@rallly/ui/icon";
import { PlusIcon } from "lucide-react";
import React from "react";

import { Attendees } from "@/components/attendees";
import { useParticipants } from "@/components/participants-provider";
import DesktopPoll from "@/components/poll/desktop-poll";
import MobilePoll from "@/components/poll/mobile-poll";
import { useVotingForm, VotingForm } from "@/components/poll/voting-form";
import { Trans } from "@/components/trans";
import { usePermissions } from "@/contexts/permissions";
import { usePoll } from "@/contexts/poll";
import { useRole } from "@/contexts/role";

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
            onClick={() => {
              form.newParticipant();
            }}
          >
            <Icon>
              <PlusIcon />
            </Icon>
            <Trans i18nKey="newParticipant" />
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

function Responses() {
  return (
    <VotingForm>
      <PollComp />
    </VotingForm>
  );
}

function ParticipantsInner() {
  const poll = usePoll();

  const role = useRole();
  if (poll.event) {
    return <Attendees optionId={poll.event.optionId} />;
  }

  if (role === "admin") {
    return <Responses />;
  }

  return <PollComp />;
}
export function Participants() {
  const { participants } = useParticipants();
  return (
    <Card>
      <CardHeader className="flex h-14 items-center justify-between">
        <div className="flex items-center gap-x-2.5">
          <CardTitle>
            <Trans i18nKey="participants" />
          </CardTitle>
          <Badge>{participants.length}</Badge>
        </div>
        <AddParticipantButton />
      </CardHeader>
      <ParticipantsInner />
    </Card>
  );
}
