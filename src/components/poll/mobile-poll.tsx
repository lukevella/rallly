import { Listbox } from "@headlessui/react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import smoothscroll from "smoothscroll-polyfill";

import Check from "@/components/icons/check.svg";
import ChevronDown from "@/components/icons/chevron-down.svg";
import Pencil from "@/components/icons/pencil-alt.svg";
import PlusCircle from "@/components/icons/plus-circle.svg";
import Trash from "@/components/icons/trash.svg";
import { usePoll } from "@/components/poll-context";

import { requiredString } from "../../utils/form-validation";
import { Button } from "../button";
import { styleMenuItem } from "../menu-styles";
import NameInput from "../name-input";
import { useParticipants } from "../participants-provider";
import { isUnclaimed, useSession } from "../session";
import TimeZonePicker from "../time-zone-picker";
import GroupedOptions from "./mobile-poll/grouped-options";
import {
  normalizeVotes,
  useAddParticipantMutation,
  useUpdateParticipantMutation,
} from "./mutations";
import { ParticipantForm } from "./types";
import { useDeleteParticipantModal } from "./use-delete-participant-modal";
import UserAvatar from "./user-avatar";

if (typeof window !== "undefined") {
  smoothscroll.polyfill();
}

const MobilePoll: React.VoidFunctionComponent = () => {
  const pollContext = usePoll();

  const {
    poll,
    targetTimeZone,
    setTargetTimeZone,
    getParticipantById,
    optionIds,
    getVote,
    userAlreadyVoted,
  } = pollContext;

  const { participants } = useParticipants();
  const { timeZone } = poll;

  const session = useSession();

  const form = useForm<ParticipantForm>({
    defaultValues: {
      name: "",
      votes: [],
    },
  });

  const { reset, handleSubmit, control, formState } = form;
  const [selectedParticipantId, setSelectedParticipantId] = React.useState<
    string | undefined
  >(() => {
    if (poll.admin) {
      // don't select a particpant if admin
      return;
    }
    const { user } = session;
    if (user) {
      const userParticipant = participants.find((participant) =>
        user.isGuest
          ? participant.guestId === user.id
          : participant.userId === user.id,
      );
      return userParticipant?.id;
    }
  });

  const selectedParticipant = selectedParticipantId
    ? getParticipantById(selectedParticipantId)
    : undefined;

  const [isEditing, setIsEditing] = React.useState(
    !userAlreadyVoted && !poll.closed && !poll.admin,
  );

  const formRef = React.useRef<HTMLFormElement>(null);

  const { t } = useTranslation("app");

  const updateParticipant = useUpdateParticipantMutation();

  const addParticipant = useAddParticipantMutation();
  const confirmDeleteParticipant = useDeleteParticipantModal();

  return (
    <FormProvider {...form}>
      <form
        ref={formRef}
        className="border-t border-b bg-white shadow-sm"
        onSubmit={handleSubmit(async ({ name, votes }) => {
          if (selectedParticipant) {
            await updateParticipant.mutateAsync({
              pollId: poll.id,
              participantId: selectedParticipant.id,
              name,
              votes: normalizeVotes(optionIds, votes),
            });
            setIsEditing(false);
          } else {
            const newParticipant = await addParticipant.mutateAsync({
              pollId: poll.id,
              name,
              votes: normalizeVotes(optionIds, votes),
            });
            setSelectedParticipantId(newParticipant.id);
            setIsEditing(false);
          }
        })}
      >
        <div className="sticky top-[47px] z-30 flex flex-col space-y-2 border-b bg-gray-50 p-3">
          <div className="flex space-x-3">
            {!isEditing ? (
              <Listbox
                value={selectedParticipantId}
                onChange={(participantId) => {
                  setSelectedParticipantId(participantId);
                }}
                disabled={isEditing}
              >
                <div className="menu min-w-0 grow">
                  <Listbox.Button
                    as={Button}
                    className="w-full"
                    disabled={!isEditing}
                    data-testid="participant-selector"
                  >
                    <div className="min-w-0 grow text-left">
                      {selectedParticipant ? (
                        <div className="flex items-center space-x-2">
                          <UserAvatar
                            name={selectedParticipant.name}
                            showName={true}
                            isYou={session.ownsObject(selectedParticipant)}
                          />
                        </div>
                      ) : (
                        t("participantCount", { count: participants.length })
                      )}
                    </div>
                    <ChevronDown className="h-5 shrink-0" />
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
                      {t("participantCount", { count: participants.length })}
                    </Listbox.Option>
                    {participants.map((participant) => (
                      <Listbox.Option
                        key={participant.id}
                        value={participant.id}
                        className={styleMenuItem}
                      >
                        <div className="flex items-center space-x-2">
                          <UserAvatar
                            name={participant.name}
                            showName={true}
                            isYou={session.ownsObject(participant)}
                          />
                        </div>
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            ) : (
              <div className="grow">
                <Controller
                  name="name"
                  control={control}
                  rules={{ validate: requiredString }}
                  render={({ field }) => (
                    <NameInput
                      disabled={formState.isSubmitting}
                      className={clsx("input w-full", {
                        "input-error": formState.errors.name,
                      })}
                      {...field}
                    />
                  )}
                />
              </div>
            )}
            {isEditing ? (
              <Button
                onClick={() => {
                  setIsEditing(false);
                  reset();
                }}
              >
                Cancel
              </Button>
            ) : selectedParticipant ? (
              <div className="flex space-x-3">
                <Button
                  icon={<Pencil />}
                  disabled={
                    poll.closed ||
                    // if user is  participant (not admin)
                    (!poll.admin &&
                      // and does not own this participant
                      !session.ownsObject(selectedParticipant) &&
                      // and the participant has been claimed by a different user
                      !isUnclaimed(selectedParticipant))
                    // not allowed to edit
                  }
                  onClick={() => {
                    setIsEditing(true);
                    reset({
                      name: selectedParticipant.name,
                      votes: optionIds.map((optionId) => ({
                        optionId,
                        type: getVote(selectedParticipant.id, optionId),
                      })),
                    });
                  }}
                >
                  Edit
                </Button>
                <Button
                  icon={<Trash />}
                  disabled={
                    poll.closed ||
                    // if user is  participant (not admin)
                    (!poll.admin &&
                      // and does not own this participant
                      !session.ownsObject(selectedParticipant) &&
                      // or the participant has been claimed by a different user
                      !isUnclaimed(selectedParticipant))
                    // not allowed to edit
                  }
                  data-testid="delete-participant-button"
                  type="danger"
                  onClick={() => {
                    if (selectedParticipant) {
                      confirmDeleteParticipant(selectedParticipant.id);
                    }
                  }}
                />
              </div>
            ) : !userAlreadyVoted ? (
              <Button
                type="primary"
                icon={<PlusCircle />}
                disabled={poll.closed}
                onClick={() => {
                  reset({
                    name: "",
                    votes: [],
                  });
                  setIsEditing(true);
                }}
              >
                New
              </Button>
            ) : null}
          </div>
          {timeZone ? (
            <TimeZonePicker
              value={targetTimeZone}
              onChange={setTargetTimeZone}
            />
          ) : null}
        </div>
        <GroupedOptions
          selectedParticipantId={selectedParticipantId}
          options={pollContext.options}
          editable={isEditing}
          groupClassName={
            pollContext.pollType === "timeSlot" ? "top-[151px]" : "top-[108px]"
          }
          group={(option) => {
            if (option.type === "timeSlot") {
              return `${option.dow} ${option.day} ${option.month}`;
            }
            return `${option.month} ${option.year}`;
          }}
        />
        <AnimatePresence>
          {isEditing ? (
            <motion.div
              variants={{
                hidden: { opacity: 0, y: -100, height: 0 },
                visible: { opacity: 1, y: 0, height: "auto" },
              }}
              initial="hidden"
              animate="visible"
              exit={{
                opacity: 0,
                y: -10,
                height: 0,
                transition: { duration: 0.2 },
              }}
            >
              <div className="space-y-3 border-t bg-gray-50 p-3">
                <Button
                  icon={<Check />}
                  className="w-full"
                  htmlType="submit"
                  type="primary"
                  loading={formState.isSubmitting}
                >
                  Save
                </Button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </form>
    </FormProvider>
  );
};

export default MobilePoll;
