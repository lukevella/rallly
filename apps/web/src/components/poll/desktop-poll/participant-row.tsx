import type { VoteType } from "@rallly/database";
import { cn } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { MoreHorizontalIcon } from "lucide-react";
import * as React from "react";

import {
  Participant,
  ParticipantAvatar,
  ParticipantName,
} from "@/components/participant";
import { ParticipantDropdown } from "@/components/participant-dropdown";
import { usePoll } from "@/components/poll-context";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { usePermissions } from "@/contexts/permissions";
import { Vote } from "@/utils/trpc/types";

import VoteIcon from "../vote-icon";
import ParticipantRowForm from "./participant-row-form";

export interface ParticipantRowProps {
  participant: {
    id: string;
    name: string;
    userId?: string;
    email?: string;
    votes: Vote[];
  };
  className?: string;
  editMode?: boolean;
  onChangeEditMode?: (editMode: boolean) => void;
}

export const ParticipantRowView: React.FunctionComponent<{
  name: string;
  action?: React.ReactNode;
  votes: Array<VoteType | undefined>;
  className?: string;
  isYou?: boolean;
  participantId: string;
}> = ({ name, action, votes, className, isYou, participantId }) => {
  return (
    <tr
      data-testid="participant-row"
      data-participantid={participantId}
      className={cn("group", className)}
    >
      <td
        style={{ minWidth: 240, maxWidth: 240 }}
        className="sticky left-0 z-10 h-12 bg-white px-4"
      >
        <div className="flex max-w-full items-center justify-between gap-x-4">
          <Participant>
            <ParticipantAvatar name={name} />
            <ParticipantName>{name}</ParticipantName>
            {isYou ? (
              <Badge>
                <Trans i18nKey="you" />
              </Badge>
            ) : null}
          </Participant>
          {action}
        </div>
      </td>
      {votes.map((vote, i) => {
        return (
          <td
            key={i}
            className={cn(
              "h-12 border-l border-t",
              !vote || vote === "no" ? "bg-gray-100" : "bg-white",
              {
                "bg-gray-100": vote === "no",
                // "bg-waves": vote === "ifNeedBe",
              },
            )}
          >
            <div className={cn("flex items-center justify-center")}>
              <div
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-full",
                  {
                    "bg-green-50": vote === "yes",
                    "bg-amber-50": vote === "ifNeedBe",
                    "bg-gray-200": vote === "no",
                  },
                )}
              >
                <VoteIcon type={vote} />
              </div>
            </div>
          </td>
        );
      })}
      <td className="bg-diagonal-lines border-l"></td>
    </tr>
  );
};

const ParticipantRow: React.FunctionComponent<ParticipantRowProps> = ({
  participant,
  editMode,
  className,
  onChangeEditMode,
}) => {
  const { user, ownsObject } = useUser();
  const { getVote, optionIds } = usePoll();

  const isYou = user && ownsObject(participant) ? true : false;

  const { canEditParticipant } = usePermissions();
  const canEdit = canEditParticipant(participant.id);

  if (editMode) {
    return (
      <ParticipantRowForm
        name={participant.name}
        isYou={isYou}
        onCancel={() => onChangeEditMode?.(false)}
      />
    );
  }

  return (
    <ParticipantRowView
      className={className}
      name={participant.name}
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
            <Button size="sm" variant="ghost">
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
