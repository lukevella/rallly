import type { VoteType } from "@rallly/database";
import { cn } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { MoreHorizontalIcon } from "lucide-react";
import type * as React from "react";

import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { Participant, ParticipantName } from "@/components/participant";
import { ParticipantDropdown } from "@/components/participant-dropdown";
import { usePoll } from "@/components/poll-context";
import { Trans } from "@/i18n/client";
import { useUser } from "@/components/user-provider";
import { usePermissions } from "@/contexts/permissions";
import type { Vote } from "@/trpc/client/types";

import VoteIcon from "../vote-icon";
import ParticipantRowForm from "./participant-row-form";

export interface ParticipantRowProps {
  participant: {
    id: string;
    name: string;
    userId?: string;
    guestId?: string;
    email?: string;
    votes: Vote[];
  };
  className?: string;
  editMode?: boolean;
  onChangeEditMode?: (editMode: boolean) => void;
}

export const ParticipantRowView: React.FunctionComponent<{
  name: string;
  email?: string;
  action?: React.ReactNode;
  votes: Array<VoteType | undefined>;
  className?: string;
  isYou?: boolean;
  participantId: string;
}> = ({ name, email, action, votes, className, isYou, participantId }) => {
  return (
    <tr
      data-testid="participant-row"
      data-participantid={participantId}
      className={cn("group", className)}
    >
      <td
        style={{ minWidth: 235, maxWidth: 235 }}
        className="sticky left-0 z-10 h-12 bg-background px-3"
      >
        <div className="flex max-w-full items-center justify-between gap-x-1">
          <Participant>
            <OptimizedAvatarImage size="sm" name={name} email={email} />
            <ParticipantName>{name}</ParticipantName>
          </Participant>
          <div className="flex items-center gap-x-2">
            {isYou ? (
              <Badge className="shrink-0">
                <Trans i18nKey="you" />
              </Badge>
            ) : null}
            {action}
          </div>
        </div>
      </td>
      {votes.map((vote, i) => {
        return (
          <td
            // biome-ignore lint/suspicious/noArrayIndexKey: Fix this later
            key={i}
            className={cn(
              "h-12 border-b border-l bg-background group-[.last-row]:border-b-0",
            )}
          >
            <div className={cn("flex items-center justify-center")}>
              <VoteIcon type={vote} />
            </div>
          </td>
        );
      })}
      <td className="border-l" />
    </tr>
  );
};

const ParticipantRow: React.FunctionComponent<ParticipantRowProps> = ({
  participant,
  editMode,
  className,
  onChangeEditMode,
}) => {
  const { ownsObject } = useUser();
  const { getVote, optionIds } = usePoll();

  const isYou = ownsObject(participant);

  const { canEditParticipant } = usePermissions();
  const canEdit = canEditParticipant(participant.id);

  if (editMode) {
    return (
      <ParticipantRowForm
        className={className}
        name={participant.name}
        email={participant.email}
        isYou={isYou}
        onCancel={() => onChangeEditMode?.(false)}
      />
    );
  }

  return (
    <ParticipantRowView
      className={className}
      name={participant.name}
      email={participant.email}
      votes={optionIds.map((optionId) => {
        return getVote(participant.id, optionId);
      })}
      participantId={participant.id}
      action={
        canEdit ? (
          <ParticipantDropdown
            participant={participant}
            align="start"
            onEdit={() => onChangeEditMode?.(true)}
          >
            <Button size="icon" variant="ghost">
              <Icon>
                <MoreHorizontalIcon />
              </Icon>
            </Button>
          </ParticipantDropdown>
        ) : null
      }
      isYou={isYou}
    />
  );
};

export default ParticipantRow;
