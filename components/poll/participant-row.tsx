import { Option, Participant, Vote } from "@prisma/client";
import clsx from "clsx";
import * as React from "react";

import Button from "../button";
import Pencil from "../icons/pencil.svg";
import Trash from "../icons/trash.svg";
import { usePoll } from "../poll-context";
import { useUpdateParticipantMutation } from "./mutations";
import ParticipantRowForm from "./participant-row-form";
import { ControlledScrollDiv } from "./poll";
import { usePollContext } from "./poll-context";
import { useDeleteParticipantModal } from "./use-delete-participant-modal";
import UserAvater from "./user-avatar";
import VoteIcon from "./vote-icon";

export interface ParticipantRowProps {
  urlId: string;
  participant: Participant & { votes: Vote[] };
  options: Array<Option & { votes: Vote[] }>;
  editMode: boolean;
  canDelete?: boolean;
  onChangeEditMode?: (value: boolean) => void;
}

const ParticipantRow: React.VoidFunctionComponent<ParticipantRowProps> = ({
  urlId,
  participant,
  options,
  editMode,
  canDelete,
  onChangeEditMode,
}) => {
  const {
    setActiveOptionId,
    activeOptionId,
    columnWidth,
    sidebarWidth,
    actionColumnWidth,
  } = usePollContext();

  const { mutate: updateParticipantMutation } =
    useUpdateParticipantMutation(urlId);

  const confirmDeleteParticipant = useDeleteParticipantModal();

  const { poll } = usePoll();
  if (editMode) {
    return (
      <ParticipantRowForm
        defaultValues={{
          name: participant.name,
          votes: participant.votes.map(({ optionId }) => optionId),
        }}
        onSubmit={async ({ name, votes }) => {
          return new Promise((resolve, reject) => {
            updateParticipantMutation(
              {
                pollId: participant.pollId,
                participantId: participant.id,
                votes,
                name,
              },
              {
                onSuccess: () => {
                  onChangeEditMode?.(false);
                  resolve();
                },
                onError: reject,
              },
            );
          });
        }}
        options={options}
        onCancel={() => onChangeEditMode?.(false)}
      />
    );
  }

  return (
    <div
      key={participant.id}
      className="group flex h-14 transition-colors hover:bg-slate-50"
    >
      <div
        className="flex shrink-0 items-center px-4"
        style={{ width: sidebarWidth }}
      >
        <UserAvater className="mr-2" name={participant.name} />
        <span className="truncate" title={participant.name}>
          {participant.name}
        </span>
      </div>
      <ControlledScrollDiv>
        {options.map((option) => {
          return (
            <div
              key={option.id}
              className={clsx(
                "flex shrink-0 items-center justify-center transition-colors",
                {
                  "bg-slate-50": activeOptionId === option.id,
                },
              )}
              style={{ width: columnWidth }}
              onMouseOver={() => setActiveOptionId(option.id)}
              onMouseOut={() => setActiveOptionId(null)}
            >
              {option.votes.some(
                (vote) => vote.participantId === participant.id,
              ) ? (
                <VoteIcon type="yes" />
              ) : (
                <VoteIcon type="no" />
              )}
            </div>
          );
        })}
      </ControlledScrollDiv>
      {!poll.closed ? (
        <div
          style={{ width: actionColumnWidth }}
          className="flex items-center space-x-2 overflow-hidden px-2 opacity-0 transition-all delay-100 group-hover:opacity-100"
        >
          <Button
            icon={<Pencil />}
            onClick={() => {
              onChangeEditMode?.(true);
            }}
          >
            Edit
          </Button>
          {canDelete ? (
            <Button
              icon={<Trash />}
              type="danger"
              onClick={() => {
                confirmDeleteParticipant(participant.id);
              }}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default ParticipantRow;
