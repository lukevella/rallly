import { Listbox } from "@headlessui/react";
import { Participant, Vote } from "@prisma/client";
import { motion } from "framer-motion";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";

import ChevronDown from "@/components/icons/chevron-down.svg";
import Pencil from "@/components/icons/pencil.svg";
import PlusCircle from "@/components/icons/plus-circle.svg";
import Trash from "@/components/icons/trash.svg";
import { usePoll } from "@/components/poll-context";

import { requiredString } from "../../utils/form-validation";
import Button from "../button";
import CheckCircle from "../icons/check-circle.svg";
import { styleMenuItem } from "../menu-styles";
import NameInput from "../name-input";
import TimeZonePicker from "../time-zone-picker";
import { useUserName } from "../user-name-context";
import DateOptions from "./mobile-poll/date-options";
import TimeSlotOptions from "./mobile-poll/time-slot-options";
import {
  useAddParticipantMutation,
  useUpdateParticipantMutation,
} from "./mutations";
import { ParticipantForm, PollProps } from "./types";
import { useDeleteParticipantModal } from "./use-delete-participant-modal";
import UserAvater from "./user-avatar";

const MobilePoll: React.VoidFunctionComponent<PollProps> = ({ pollId }) => {
  const pollContext = usePoll();

  const { poll, targetTimeZone, setTargetTimeZone } = pollContext;

  const { timeZone, participants, role } = poll;

  const [, setUserName] = useUserName();

  const participantById = participants.reduce<
    Record<string, Participant & { votes: Vote[] }>
  >((acc, curr) => {
    acc[curr.id] = { ...curr };
    return acc;
  }, {});

  const form = useForm<ParticipantForm>({
    defaultValues: {
      name: "",
      votes: [],
    },
  });

  const { reset, handleSubmit, control, formState } = form;
  const [selectedParticipantId, setSelectedParticipantId] =
    React.useState<string>();

  const selectedParticipant = selectedParticipantId
    ? participantById[selectedParticipantId]
    : undefined;
  const [mode, setMode] = React.useState<"edit" | "default">(() =>
    participants.length > 0 ? "default" : "edit",
  );

  const { t } = useTranslation("app");

  const { mutate: updateParticipantMutation } =
    useUpdateParticipantMutation(pollId);

  const { mutate: addParticipantMutation } = useAddParticipantMutation(pollId);
  const confirmDeleteParticipant = useDeleteParticipantModal();

  return (
    <FormProvider {...form}>
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
        <div className="sticky top-0 z-30 flex flex-col space-y-2 border-b bg-gray-50 px-4 py-2">
          {timeZone ? (
            <TimeZonePicker
              value={targetTimeZone}
              onChange={setTargetTimeZone}
            />
          ) : null}
          {mode === "default" ? (
            <div className="flex space-x-3">
              <Listbox
                value={selectedParticipantId}
                onChange={setSelectedParticipantId}
              >
                <div className="menu grow">
                  <Listbox.Button className="btn-default w-full px-2 text-left">
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
                        reset({
                          name: selectedParticipant.name,
                          votes: selectedParticipant.votes.map(
                            (vote) => vote.optionId,
                          ),
                        });
                      }}
                    >
                      Edit
                    </Button>
                    {role === "admin" ? (
                      <Button
                        icon={<Trash />}
                        type="danger"
                        onClick={() => {
                          if (selectedParticipant) {
                            confirmDeleteParticipant(selectedParticipant.id);
                          }
                        }}
                      />
                    ) : null}
                  </div>
                ) : (
                  <Button
                    type="primary"
                    icon={<PlusCircle />}
                    onClick={() => {
                      reset({ name: "", votes: [] });
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
                  className="w-full"
                  {...field}
                />
              )}
            />
          ) : null}
        </div>
        {(() => {
          switch (pollContext.pollType) {
            case "date":
              return (
                <DateOptions
                  selectedParticipantId={selectedParticipantId}
                  options={pollContext.options}
                  editable={mode === "edit"}
                />
              );
            case "timeSlot":
              return (
                <TimeSlotOptions
                  selectedParticipantId={selectedParticipantId}
                  options={pollContext.options}
                  editable={mode === "edit"}
                />
              );
          }
        })()}
        {mode === "edit" ? (
          <div className="flex w-full space-x-3 border-t bg-slate-50 p-2">
            <Button
              className="grow"
              onClick={() => {
                setMode("default");
                reset();
              }}
            >
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
    </FormProvider>
  );
};

export default MobilePoll;
