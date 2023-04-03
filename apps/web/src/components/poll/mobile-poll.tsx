import { Listbox } from "@headlessui/react";
import ChevronDown from "@rallly/icons/chevron-down.svg";
import PlusCircle from "@rallly/icons/plus-circle.svg";
import { AnimatePresence, m } from "framer-motion";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { FormProvider, useForm } from "react-hook-form";
import smoothscroll from "smoothscroll-polyfill";

import { ParticipantDropdown } from "@/components/participant-dropdown";
import { usePoll } from "@/components/poll-context";
import { You } from "@/components/you";

import { Button } from "../button";
import { styleMenuItem } from "../menu-styles";
import { useNewParticipantModal } from "../new-participant-modal";
import { useParticipants } from "../participants-provider";
import TimeZonePicker from "../time-zone-picker";
import { isUnclaimed, useUser } from "../user-provider";
import GroupedOptions from "./mobile-poll/grouped-options";
import { normalizeVotes, useUpdateParticipantMutation } from "./mutations";
import { ParticipantForm } from "./types";
import UserAvatar from "./user-avatar";

if (typeof window !== "undefined") {
  smoothscroll.polyfill();
}

const MobilePoll: React.FunctionComponent = () => {
  const pollContext = usePoll();

  const {
    poll,
    admin,
    targetTimeZone,
    setTargetTimeZone,
    getParticipantById,
    optionIds,
    getVote,
    userAlreadyVoted,
  } = pollContext;

  const { participants } = useParticipants();
  const { timeZone } = poll;

  const session = useUser();

  const form = useForm<ParticipantForm>({
    defaultValues: {
      votes: [],
    },
  });

  const { reset, handleSubmit, formState } = form;
  const [selectedParticipantId, setSelectedParticipantId] = React.useState<
    string | undefined
  >(() => {
    if (!admin) {
      const participant = participants.find((p) => session.ownsObject(p));
      return participant?.id;
    }
  });

  const selectedParticipant = selectedParticipantId
    ? getParticipantById(selectedParticipantId)
    : undefined;

  const [isEditing, setIsEditing] = React.useState(
    !userAlreadyVoted && !poll.closed && !admin,
  );

  const formRef = React.useRef<HTMLFormElement>(null);

  const { t } = useTranslation("app");

  const updateParticipant = useUpdateParticipantMutation();

  const showNewParticipantModal = useNewParticipantModal();

  return (
    <FormProvider {...form}>
      <form
        ref={formRef}
        onSubmit={handleSubmit(async ({ votes }) => {
          if (selectedParticipant) {
            await updateParticipant.mutateAsync({
              pollId: poll.id,
              participantId: selectedParticipant.id,
              votes: normalizeVotes(optionIds, votes),
            });
            setIsEditing(false);
          } else {
            showNewParticipantModal({
              votes: normalizeVotes(optionIds, votes),
              onSubmit: async ({ id }) => {
                setSelectedParticipantId(id);
                setIsEditing(false);
              },
            });
          }
        })}
      >
        <div className="flex flex-col space-y-2 border-b bg-gray-50 p-2">
          <div className="flex space-x-2">
            {selectedParticipantId || !isEditing ? (
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
                    as={m.div}
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
              <div className="flex grow items-center px-1">
                <You />
              </div>
            )}
            {isEditing ? (
              <Button
                onClick={() => {
                  setIsEditing(false);
                  reset();
                }}
              >
                {t("cancel")}
              </Button>
            ) : selectedParticipant ? (
              <ParticipantDropdown
                disabled={
                  poll.closed ||
                  // if user is  participant (not admin)
                  (!admin &&
                    // and does not own this participant
                    !session.ownsObject(selectedParticipant) &&
                    // and the participant has been claimed by a different user
                    !isUnclaimed(selectedParticipant))
                  // not allowed to edit
                }
                participant={selectedParticipant}
                onEdit={() => {
                  setIsEditing(true);
                  reset({
                    votes: optionIds.map((optionId) => ({
                      optionId,
                      type: getVote(selectedParticipant.id, optionId),
                    })),
                  });
                }}
              />
            ) : (
              <Button
                type="primary"
                icon={<PlusCircle />}
                disabled={poll.closed}
                onClick={() => {
                  reset({
                    votes: [],
                  });
                  setIsEditing(true);
                }}
              >
                {t("new")}
              </Button>
            )}
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
          group={(option) => {
            if (option.type === "timeSlot") {
              return `${option.dow} ${option.day} ${option.month}`;
            }
            return `${option.month} ${option.year}`;
          }}
        />
        <AnimatePresence>
          {isEditing ? (
            <m.div
              variants={{
                hidden: { opacity: 0, y: -20, height: 0 },
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
                  className="w-full"
                  htmlType="submit"
                  type="primary"
                  loading={formState.isSubmitting}
                >
                  {selectedParticipantId ? t("save") : t("continue")}
                </Button>
              </div>
            </m.div>
          ) : null}
        </AnimatePresence>
      </form>
    </FormProvider>
  );
};

export default MobilePoll;
