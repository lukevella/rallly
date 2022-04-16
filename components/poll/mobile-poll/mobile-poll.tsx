import { Listbox } from "@headlessui/react";
import { Participant, Vote } from "@prisma/client";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";

import { usePoll } from "@/components/use-poll";

import { decodeDateOption } from "../../../utils/date-time-utils";
import { requiredString } from "../../../utils/form-validation";
import Button from "../../button";
import DateCard from "../../date-card";
import CheckCircle from "../../icons/check-circle.svg";
import ChevronDown from "../../icons/chevron-down.svg";
import Pencil from "../../icons/pencil.svg";
import PlusCircle from "../../icons/plus-circle.svg";
import Trash from "../../icons/trash.svg";
import { styleMenuItem } from "../../menu-styles";
import NameInput from "../../name-input";
import TimeZonePicker from "../../time-zone-picker";
import { useUserName } from "../../user-name-context";
import {
  useAddParticipantMutation,
  useUpdateParticipantMutation,
} from "../mutations";
import TimeRange from "../time-range";
import { ParticipantForm, PollProps } from "../types";
import { useDeleteParticipantModal } from "../use-delete-participant-modal";
import UserAvater from "../user-avatar";
import VoteIcon from "../vote-icon";

const MobilePoll: React.VoidFunctionComponent<PollProps> = ({
  pollId,
  timeZone,
  options,
  participants,
  highScore,
  targetTimeZone,
  onChangeTargetTimeZone,
  role,
}) => {
  const [, setUserName] = useUserName();

  const participantById = participants.reduce<
    Record<string, Participant & { votes: Vote[] }>
  >((acc, curr) => {
    acc[curr.id] = { ...curr };
    return acc;
  }, {});

  const { register, setValue, reset, handleSubmit, control, formState } =
    useForm<ParticipantForm>({
      defaultValues: {
        name: "",
        votes: [],
      },
    });
  const [selectedParticipantId, setSelectedParticipantId] =
    React.useState<string>();

  const selectedParticipant = selectedParticipantId
    ? participantById[selectedParticipantId]
    : undefined;

  const selectedParticipantVotedOption = selectedParticipant
    ? selectedParticipant.votes.map((vote) => vote.optionId)
    : undefined;

  const [mode, setMode] = React.useState<"edit" | "default">(() =>
    participants.length > 0 ? "default" : "edit",
  );

  const { t } = useTranslation("app");

  const { mutate: updateParticipantMutation } =
    useUpdateParticipantMutation(pollId);

  const { mutate: addParticipantMutation } = useAddParticipantMutation(pollId);
  const [deleteParticipantModal, confirmDeleteParticipant] =
    useDeleteParticipantModal(pollId, selectedParticipantId ?? ""); // TODO (Luke Vella) [2022-03-14]:  Figure out a better way to deal with these modals

  // This hack is necessary because when there is only one checkbox,
  // react-hook-form does not know to format the value into an array.
  // See: https://github.com/react-hook-form/react-hook-form/issues/7834
  const checkboxGroupHack = (
    <input type="checkbox" className="hidden" {...register("votes")} />
  );

  const poll = usePoll();

  return (
    <form
      className="border-t border-b bg-white shadow-sm"
      onSubmit={handleSubmit((data) => {
        return new Promise<ParticipantForm>((resolve, reject) => {
          if (selectedParticipant) {
            updateParticipantMutation(
              {
                participantId: selectedParticipant.id,
                pollId,
                ...data,
              },
              {
                onSuccess: () => {
                  setMode("default");
                  resolve(data);
                },
                onError: reject,
              },
            );
          } else {
            addParticipantMutation(data, {
              onSuccess: (newParticipant) => {
                setMode("default");
                setSelectedParticipantId(newParticipant.id);
                resolve(data);
              },
              onError: reject,
            });
          }
        });
      })}
    >
      {checkboxGroupHack}
      <div className="sticky top-0 z-30 flex flex-col space-y-2 border-b bg-gray-50 px-4 py-2">
        {mode === "default" ? (
          <div className="flex space-x-3">
            <Listbox
              value={selectedParticipantId}
              onChange={setSelectedParticipantId}
            >
              <div className="menu grow">
                <Listbox.Button className="btn-default w-full text-left">
                  <div className="grow">
                    {selectedParticipant ? (
                      <div className="flex items-center space-x-2">
                        <UserAvater name={selectedParticipant.name} />
                        <span>{selectedParticipant.name}</span>
                      </div>
                    ) : (
                      t("participantCount", { count: participants.length })
                    )}
                  </div>
                  <ChevronDown className="h-5" />
                </Listbox.Button>
                <Listbox.Options
                  as={motion.div}
                  transition={{
                    duration: 0.1,
                  }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="menu-items max-h-72 w-full overflow-auto"
                >
                  <Listbox.Option value={undefined} className={styleMenuItem}>
                    Show all
                  </Listbox.Option>
                  {participants.map((participant) => (
                    <Listbox.Option
                      key={participant.id}
                      value={participant.id}
                      className={styleMenuItem}
                    >
                      <div className="flex items-center space-x-2">
                        <UserAvater name={participant.name} />
                        <span>{participant.name}</span>
                      </div>
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
            {!poll.closed ? (
              selectedParticipant ? (
                <div className="flex space-x-3">
                  <Button
                    icon={<Pencil />}
                    onClick={() => {
                      setMode("edit");
                      setValue("name", selectedParticipant.name);
                      setValue(
                        "votes",
                        selectedParticipant.votes.map((vote) => vote.optionId),
                      );
                    }}
                  >
                    Edit
                  </Button>
                  {role === "admin" ? (
                    <Button
                      icon={<Trash />}
                      type="danger"
                      onClick={confirmDeleteParticipant}
                    />
                  ) : null}
                  {deleteParticipantModal}
                </div>
              ) : (
                <Button
                  type="primary"
                  icon={<PlusCircle />}
                  onClick={() => {
                    reset();
                    setUserName("");
                    setMode("edit");
                  }}
                >
                  New
                </Button>
              )
            ) : null}
          </div>
        ) : null}
        {mode === "edit" ? (
          <Controller
            name="name"
            control={control}
            rules={{ validate: requiredString }}
            render={({ field }) => (
              <NameInput
                disabled={formState.isSubmitting}
                autoFocus={!selectedParticipant}
                className="w-full"
                {...field}
              />
            )}
          />
        ) : null}
        {timeZone ? (
          <TimeZonePicker
            value={targetTimeZone}
            onChange={onChangeTargetTimeZone}
          />
        ) : null}
      </div>
      <div className="divide-y">
        {options.map((option) => {
          const parsedOption = decodeDateOption(
            option.value,
            timeZone,
            targetTimeZone,
          );
          const numVotes = option.votes.length;
          return (
            <div
              key={option.id}
              className="flex items-center space-x-4 px-4 py-2"
            >
              <div>
                <DateCard
                  day={parsedOption.day}
                  dow={parsedOption.dow}
                  month={parsedOption.month}
                />
              </div>
              {parsedOption.type === "timeSlot" ? (
                <TimeRange
                  startTime={parsedOption.startTime}
                  endTime={parsedOption.endTime}
                  className="shrink-0"
                />
              ) : null}

              <div className="grow items-center space-y-1">
                <div>
                  <span
                    className={clsx(
                      "inline-block rounded-full border px-2 text-xs leading-relaxed",
                      {
                        "border-slate-200": numVotes !== highScore,
                        "border-rose-500 text-rose-500": numVotes === highScore,
                      },
                    )}
                  >
                    {t("voteCount", { count: numVotes })}
                  </span>
                </div>
                {option.votes.length ? (
                  <div className="-space-x-1">
                    {option.votes
                      .slice(0, option.votes.length <= 6 ? 6 : 5)
                      .map((vote) => {
                        const participant = participantById[vote.participantId];
                        return (
                          <UserAvater
                            key={vote.id}
                            className="ring-1 ring-white"
                            name={participant.name}
                          />
                        );
                      })}
                    {option.votes.length > 6 ? (
                      <span className="inline-flex h-5 items-center justify-center rounded-full bg-slate-100 px-1 text-xs font-medium ring-1 ring-white">
                        +{option.votes.length - 5}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="flex h-14 w-12 items-center justify-center">
                {mode === "edit" ? (
                  <input
                    type="checkbox"
                    className="checkbox"
                    value={option.id}
                    {...register("votes")}
                  />
                ) : selectedParticipantVotedOption ? (
                  selectedParticipantVotedOption.includes(option.id) ? (
                    <VoteIcon type="yes" />
                  ) : (
                    <VoteIcon type="no" />
                  )
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      {mode === "edit" ? (
        <div className="flex space-x-3 border-t p-2">
          <Button className="grow" onClick={() => setMode("default")}>
            Cancel
          </Button>
          <Button
            icon={<CheckCircle />}
            htmlType="submit"
            className="grow"
            type="primary"
            loading={formState.isSubmitting}
          >
            Save
          </Button>
        </div>
      ) : null}
    </form>
  );
};

export default MobilePoll;
