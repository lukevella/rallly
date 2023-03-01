import { Participant, Vote, VoteType } from "@prisma/client";
import clsx from "clsx";
import { useTranslation } from "next-i18next";
import * as React from "react";

import DotsVertical from "@/components/icons/dots-vertical.svg";
import Pencil from "@/components/icons/pencil-alt.svg";
import Trash from "@/components/icons/trash.svg";
import { usePoll } from "@/components/poll-context";
import { useUser } from "@/components/user-provider";

import Dropdown, { DropdownItem } from "../../dropdown";
import { ParticipantFormSubmitted } from "../types";
import { useDeleteParticipantModal } from "../use-delete-participant-modal";
import UserAvatar from "../user-avatar";
import VoteIcon from "../vote-icon";
import ControlledScrollArea from "./controlled-scroll-area";
import ParticipantRowForm from "./participant-row-form";
import { usePollContext } from "./poll-context";

export interface ParticipantRowProps {
  participant: Participant & { votes: Vote[] };
  className?: string;
  editMode?: boolean;
  disableEditing?: boolean;
  onChangeEditMode?: (editMode: boolean) => void;
  onSubmit?: (data: ParticipantFormSubmitted) => Promise<void>;
}

export const ParticipantRowView: React.FunctionComponent<{
  name: string;
  editable?: boolean;
  color?: string;
  votes: Array<VoteType | undefined>;
  onEdit?: () => void;
  onDelete?: () => void;
  columnWidth: number;
  className?: string;
  sidebarWidth: number;
  isYou?: boolean;
  participantId: string;
}> = ({
  name,
  editable,
  votes,
  onEdit,
  className,
  onDelete,
  sidebarWidth,
  columnWidth,
  isYou,
  color,
  participantId,
}) => {
  const { t } = useTranslation("app");
  return (
    <div
      data-testid="participant-row"
      data-participantid={participantId}
      className={clsx("flex h-12 items-center", className)}
    >
      <div
        className="flex h-full shrink-0 items-center justify-between gap-2 px-3"
        style={{ width: sidebarWidth }}
      >
        <UserAvatar name={name} showName={true} isYou={isYou} color={color} />
        {editable ? (
          <div className="flex">
            <Dropdown
              placement="bottom-start"
              trigger={
                <button className="text-slate-500 hover:text-slate-800">
                  <DotsVertical className="h-3" />
                </button>
              }
            >
              <DropdownItem icon={Pencil} onClick={onEdit} label={t("edit")} />
              <DropdownItem
                icon={Trash}
                onClick={onDelete}
                label={t("delete")}
              />
            </Dropdown>
          </div>
        ) : null}
      </div>
      <ControlledScrollArea className="h-full">
        {votes.map((vote, i) => {
          return (
            <div
              key={i}
              className={clsx("relative flex h-full shrink-0 p-1")}
              style={{ width: columnWidth }}
            >
              <div
                className={clsx(
                  "flex h-full w-full items-center justify-center rounded border border-slate-200 bg-slate-50/75",
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

const ParticipantRow: React.FunctionComponent<ParticipantRowProps> = ({
  participant,
  editMode,
  onSubmit,
  className,
  disableEditing,
  onChangeEditMode,
}) => {
  const { columnWidth, sidebarWidth } = usePollContext();

  const confirmDeleteParticipant = useDeleteParticipantModal();

  const session = useUser();
  const { poll, getVote, options, admin } = usePoll();

  const isYou = session.user && session.ownsObject(participant) ? true : false;

  const isUnclaimed = !participant.userId;

  const canEdit =
    !disableEditing && !poll.closed && (admin || isYou || isUnclaimed);

  if (editMode) {
    return (
      <ParticipantRowForm
        name={participant.name}
        defaultValues={{
          votes: options.map(({ optionId }) => {
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
