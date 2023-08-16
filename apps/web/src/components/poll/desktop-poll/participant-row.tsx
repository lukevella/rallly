import { Participant, Vote, VoteType } from "@rallly/database";
import { MoreHorizontalIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import clsx from "clsx";
import * as React from "react";

import { ParticipantDropdown } from "@/components/participant-dropdown";
import { usePoll } from "@/components/poll-context";
import { useUser } from "@/components/user-provider";
import { usePermissions } from "@/contexts/permissions";

import UserAvatar from "../user-avatar";
import VoteIcon from "../vote-icon";
import ParticipantRowForm from "./participant-row-form";

export interface ParticipantRowProps {
  participant: Participant & { votes: Vote[] };
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
      className={clsx(className)}
    >
      <td
        style={{ minWidth: 240, maxWidth: 240 }}
        className="sticky left-0 z-10 bg-white px-4"
      >
        <div className="flex max-w-full items-center justify-between gap-x-4 ">
          <UserAvatar name={name} showName={true} isYou={isYou} />
          {action}
        </div>
      </td>
      {votes.map((vote, i) => {
        return (
          <td key={i} className={clsx("h-12 p-1")}>
            <div
              className={clsx(
                "flex h-full items-center justify-center rounded-md border",
                {
                  "border-green-200 bg-green-50": vote === "yes",
                  "border-amber-100 bg-amber-50": vote === "ifNeedBe",
                  "bg-gray-50": vote === "no",
                },
              )}
            >
              <VoteIcon type={vote} />
            </div>
          </td>
        );
      })}
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
            <Button size="sm" icon={MoreHorizontalIcon} />
          </ParticipantDropdown>
        ) : null
      }
      isYou={isYou}
    />
  );
};

export default ParticipantRow;
