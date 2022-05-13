import { Option, Participant, Vote } from "@prisma/client";
import clsx from "clsx";
import * as React from "react";

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
  options: Option[];
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
  const { poll, getVote } = usePoll();

  const isYou = session.user && session.ownsObject(participant) ? true : false;

  const isAnonymous = !participant.userId && !participant.guestId;

  const canEdit =
    !poll.closed && (poll.role === "admin" || isYou || isAnonymous);

  if (editMode) {
    return (
      <ParticipantRowForm
        defaultValues={{
          name: participant.name,
          votes: options.map(({ id }) => {
            const type = getVote(participant.id, id);
            return type ? { optionId: id, type } : undefined;
          }),
        }}
        onSubmit={async ({ name, votes }) => {
          return new Promise((resolve, reject) => {
            updateParticipantMutation(
              {
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
      className="group flex h-14 transition-colors hover:bg-slate-300/10"
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
          <div className="hidden shrink-0 items-center space-x-2 overflow-hidden group-hover:flex">
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
          const vote = getVote(participant.id, option.id);
          return (
            <div
              key={option.id}
              className={clsx(
                "flex shrink-0 items-center justify-center transition-colors",
                {
                  "bg-gray-50": activeOptionId === option.id,
                },
              )}
              style={{ width: columnWidth }}
              onMouseOver={() => setActiveOptionId(option.id)}
              onMouseOut={() => setActiveOptionId(null)}
            >
              <VoteIcon type={vote} />
            </div>
          );
        })}
      </ControlledScrollArea>
    </div>
  );
};

export default ParticipantRow;
