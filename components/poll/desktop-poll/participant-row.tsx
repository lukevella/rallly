import { Option, Participant, Vote } from "@prisma/client";
import clsx from "clsx";
import * as React from "react";

import Badge from "@/components/badge";
import CompactButton from "@/components/compact-button";
import Pencil from "@/components/icons/pencil-alt.svg";
import Trash from "@/components/icons/trash.svg";
import { usePoll } from "@/components/poll-context";
import { useSession } from "@/components/session";

import { useUpdateParticipantMutation } from "../mutations";
import { useDeleteParticipantModal } from "../use-delete-participant-modal";
import UserAvatar from "../user-avatar";
import VoteIcon from "../vote-icon";
import ControlledScrollArea from "./controlled-scroll-area";
import ParticipantRowForm from "./participant-row-form";
import { usePollContext } from "./poll-context";

export interface ParticipantRowProps {
  urlId: string;
  participant: Participant & { votes: Vote[] };
  options: Array<Option & { votes: Vote[] }>;
  editMode: boolean;
  onChangeEditMode?: (value: boolean) => void;
}

const ParticipantRow: React.VoidFunctionComponent<ParticipantRowProps> = ({
  urlId,
  participant,
  options,
  editMode,
  onChangeEditMode,
}) => {
  const { setActiveOptionId, activeOptionId, columnWidth, sidebarWidth } =
    usePollContext();

  const { mutate: updateParticipantMutation } =
    useUpdateParticipantMutation(urlId);

  const confirmDeleteParticipant = useDeleteParticipantModal();

  const session = useSession();
  const { poll } = usePoll();

  const isYou = session.user && session.ownsObject(participant) ? true : false;

  const isAnonymous = !participant.userId && !participant.guestId;

  const canEdit =
    !poll.closed && (poll.role === "admin" || isYou || isAnonymous);

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
      data-testid="participant-row"
      className="group flex h-14 transition-colors hover:bg-slate-50"
    >
      <div
        className="flex shrink-0 items-center px-4"
        style={{ width: sidebarWidth }}
      >
        <UserAvatar
          className="mr-2"
          name={participant.name}
          showName={true}
          isYou={isYou}
        />
        {canEdit ? (
          <div className="hidden shrink-0 items-center space-x-2 overflow-hidden px-2 group-hover:flex">
            <CompactButton
              icon={Pencil}
              onClick={() => {
                onChangeEditMode?.(true);
              }}
            />
            <CompactButton
              icon={Trash}
              onClick={() => {
                confirmDeleteParticipant(participant.id);
              }}
            />
          </div>
        ) : null}
      </div>
      <ControlledScrollArea>
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
      </ControlledScrollArea>
    </div>
  );
};

export default ParticipantRow;
