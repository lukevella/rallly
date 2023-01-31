import { Participant, Vote, VoteType } from "@prisma/client";
import clsx from "clsx";
import * as React from "react";

import CompactButton from "@/components/compact-button";
import Pencil from "@/components/icons/pencil-alt.svg";
import Trash from "@/components/icons/trash.svg";
import { usePoll } from "@/components/poll-context";
import { useUser } from "@/components/user-provider";

import { ParticipantFormSubmitted } from "../types";
import { useDeleteParticipantModal } from "../use-delete-participant-modal";
import UserAvatar from "../user-avatar";
import VoteIcon from "../vote-icon";
import ControlledScrollArea from "./controlled-scroll-area";
import ParticipantRowForm from "./participant-row-form";
import { usePollContext } from "./poll-context";

export interface ParticipantRowProps {
  participant: Participant & { votes: Vote[] };
  editMode?: boolean;
  onChangeEditMode?: (editMode: boolean) => void;
  onSubmit?: (data: ParticipantFormSubmitted) => Promise<void>;
}

export const ParticipantRowView: React.VoidFunctionComponent<{
  name: string;
  editable?: boolean;
  color?: string;
  votes: Array<VoteType | undefined>;
  onEdit?: () => void;
  onDelete?: () => void;
  columnWidth: number;
  sidebarWidth: number;
  isYou?: boolean;
  participantId: string;
}> = ({
  name,
  editable,
  votes,
  onEdit,
  onDelete,
  sidebarWidth,
  columnWidth,
  isYou,
  color,
  participantId,
}) => {
  return (
    <div
      data-testid="participant-row"
      data-participantid={participantId}
      className="group flex h-14 items-center"
    >
      <div
        className="flex shrink-0 items-center px-4"
        style={{ width: sidebarWidth }}
      >
        <UserAvatar
          className="mr-2"
          name={name}
          showName={true}
          isYou={isYou}
          color={color}
        />
        {editable ? (
          <div className="hidden shrink-0 items-center space-x-2 overflow-hidden group-hover:flex">
            <CompactButton icon={Pencil} onClick={onEdit} />
            <CompactButton icon={Trash} onClick={onDelete} />
          </div>
        ) : null}
      </div>
      <ControlledScrollArea>
        {votes.map((vote, i) => {
          return (
            <div
              key={i}
              className="relative flex shrink-0 items-center justify-center px-2 transition-colors"
              style={{ width: columnWidth }}
            >
              <div
                className={clsx(
                  "flex h-10 w-full items-center justify-center rounded-md",
                  {
                    "bg-green-50": vote === "yes",
                    "bg-amber-50": vote === "ifNeedBe",
                    "bg-slate-50": vote === "no",
                  },
                )}
              >
                <VoteIcon type={vote} />
              </div>
            </div>
          );
        })}
      </ControlledScrollArea>
    </div>
  );
};

const ParticipantRow: React.VoidFunctionComponent<ParticipantRowProps> = ({
  participant,
  editMode,
  onSubmit,
  onChangeEditMode,
}) => {
  const { columnWidth, sidebarWidth } = usePollContext();

  const confirmDeleteParticipant = useDeleteParticipantModal();

  const session = useUser();
  const { poll, getVote, options, admin } = usePoll();

  const isYou = session.user && session.ownsObject(participant) ? true : false;

  const isUnclaimed = !participant.userId;

  const canEdit = !poll.closed && (admin || isYou || isUnclaimed);

  if (editMode) {
    return (
      <ParticipantRowForm
        defaultValues={{
          name: participant.name,
          votes: options.map(({ optionId }) => {
            const type = getVote(participant.id, optionId);
            return type ? { optionId, type } : undefined;
          }),
        }}
        onSubmit={async ({ name, votes }) => {
          await onSubmit?.({ name, votes });
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
      name={participant.name}
      votes={options.map(({ optionId }) => {
        return getVote(participant.id, optionId);
      })}
      participantId={participant.id}
      editable={canEdit}
      isYou={isYou}
      onEdit={() => {
        onChangeEditMode?.(true);
      }}
      onDelete={() => {
        confirmDeleteParticipant(participant.id);
      }}
    />
  );
};

export default ParticipantRow;
