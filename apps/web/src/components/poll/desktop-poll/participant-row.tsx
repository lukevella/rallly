import { Participant, Vote, VoteType } from "@rallly/database";
import { MoreHorizontalIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import clsx from "clsx";
import * as React from "react";

import { ParticipantDropdown } from "@/components/participant-dropdown";
import { usePoll } from "@/components/poll-context";
import { useUser } from "@/components/user-provider";
import { usePermissions } from "@/contexts/permissions";

import { ParticipantFormSubmitted } from "../types";
import UserAvatar from "../user-avatar";
import VoteIcon from "../vote-icon";
import ParticipantRowForm from "./participant-row-form";
import { usePollContext } from "./poll-context";

export interface ParticipantRowProps {
  participant: Participant & { votes: Vote[] };
  className?: string;
  editMode?: boolean;
  onChangeEditMode?: (editMode: boolean) => void;
  onSubmit?: (data: ParticipantFormSubmitted) => Promise<void>;
}

export const ParticipantRowView: React.FunctionComponent<{
  name: string;
  action?: React.ReactNode;
  votes: Array<VoteType | undefined>;
  columnWidth: number;
  className?: string;
  sidebarWidth: number;
  isYou?: boolean;
  participantId: string;
}> = ({
  name,
  action,
  votes,
  className,
  sidebarWidth,
  columnWidth,
  isYou,
  participantId,
}) => {
  return (
    <tr
      data-testid="participant-row"
      data-participantid={participantId}
      className={clsx(className)}
    >
      <td
        className="sticky left-0 z-10 bg-white pl-4 pr-4"
        style={{ width: sidebarWidth }}
      >
        <div className="flex items-center justify-between gap-x-4 ">
          <UserAvatar name={name} showName={true} isYou={isYou} />
          {action}
        </div>
      </td>
      {votes.map((vote, i) => {
        return (
          <td
            key={i}
            className={clsx("h-12 p-1")}
            style={{ width: columnWidth }}
          >
            <div
              className={clsx(
                "flex h-full w-full items-center justify-center rounded border bg-gray-50",
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
  onSubmit,
  className,
  onChangeEditMode,
}) => {
  const { columnWidth, sidebarWidth } = usePollContext();

  const { user, ownsObject } = useUser();
  const { getVote, optionIds } = usePoll();

  const isYou = user && ownsObject(participant) ? true : false;

  const { canEditParticipant } = usePermissions();
  const canEdit = canEditParticipant(participant.id);

  if (editMode) {
    return (
      <ParticipantRowForm
        name={participant.name}
        defaultValues={{
          votes: optionIds.map((optionId) => {
            const type = getVote(participant.id, optionId);
            return type ? { optionId, type } : undefined;
          }),
        }}
        isYou={isYou}
        onSubmit={async ({ votes }) => {
          await onSubmit?.({ votes });
          onChangeEditMode?.(false);
        }}
        onCancel={() => onChangeEditMode?.(false)}
      />
    );
  }

  return (
    <ParticipantRowView
      sidebarWidth={sidebarWidth}
      columnWidth={columnWidth}
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
