import { Listbox } from "@headlessui/react";
import { ChevronDownIcon, MoreHorizontalIcon, PlusIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import { AnimatePresence, m } from "framer-motion";
import { useTranslation } from "next-i18next";
import * as React from "react";
import smoothscroll from "smoothscroll-polyfill";

import { TimesShownIn } from "@/components/clock";
import { ParticipantDropdown } from "@/components/participant-dropdown";
import { useVotingForm } from "@/components/poll/voting-form";
import { useOptions, usePoll } from "@/components/poll-context";
import { usePermissions } from "@/contexts/permissions";

import { styleMenuItem } from "../menu-styles";
import {
  useParticipants,
  useVisibleParticipants,
} from "../participants-provider";
import { useUser } from "../user-provider";
import GroupedOptions from "./mobile-poll/grouped-options";
import UserAvatar, { YouAvatar } from "./user-avatar";

if (typeof window !== "undefined") {
  smoothscroll.polyfill();
}

const MobilePoll: React.FunctionComponent = () => {
  const pollContext = usePoll();

  const { poll, getParticipantById } = pollContext;

  const { options } = useOptions();
  const { participants } = useParticipants();

  const session = useUser();

  const votingForm = useVotingForm();
  const { formState } = votingForm;

  const selectedParticipantId = votingForm.watch("participantId");

  const visibleParticipants = useVisibleParticipants();
  const selectedParticipant = selectedParticipantId
    ? getParticipantById(selectedParticipantId)
    : undefined;

  const { canEditParticipant, canAddNewParticipant } = usePermissions();

  const { t } = useTranslation();

  const isEditing = votingForm.watch("mode") !== "view";

  return (
    <>
      <div className="flex flex-col space-y-2 border-b bg-gray-50 p-2">
        <div className="flex space-x-2">
          {selectedParticipantId || !isEditing ? (
            <Listbox
              value={selectedParticipantId}
              onChange={(participantId) => {
                votingForm.setValue("participantId", participantId);
              }}
              disabled={isEditing}
            >
              <div className="menu min-w-0 grow">
                <Listbox.Button
                  as={Button}
                  className="w-full shadow-none"
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
                  <ChevronDownIcon className="h-5 shrink-0" />
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
                  {visibleParticipants.map((participant) => (
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
              <YouAvatar />
            </div>
          )}
          {isEditing ? (
            <Button
              onClick={() => {
                if (votingForm.watch("mode") === "new") {
                  votingForm.cancel();
                } else {
                  votingForm.setValue("mode", "view");
                }
              }}
            >
              {t("cancel")}
            </Button>
          ) : selectedParticipant ? (
            <ParticipantDropdown
              align="end"
              disabled={!canEditParticipant(selectedParticipant.id)}
              participant={selectedParticipant}
              onEdit={() => {
                votingForm.setEditingParticipantId(selectedParticipant.id);
              }}
            >
              <Button icon={MoreHorizontalIcon} />
            </ParticipantDropdown>
          ) : canAddNewParticipant ? (
            <Button
              icon={PlusIcon}
              onClick={() => {
                votingForm.newParticipant();
              }}
            />
          ) : null}
        </div>
      </div>
      {poll.options[0].duration !== 0 ? (
        <div className="flex border-b bg-gray-50 p-3">
          <TimesShownIn />
        </div>
      ) : null}
      <GroupedOptions
        selectedParticipantId={selectedParticipantId}
        options={options}
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
                form="voting-form"
                className="w-full"
                type="submit"
                variant="primary"
                loading={formState.isSubmitting}
              >
                {selectedParticipantId ? t("save") : t("continue")}
              </Button>
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </>
  );
};

export default MobilePoll;
