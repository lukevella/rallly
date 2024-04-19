import { Button } from "@rallly/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import { AnimatePresence, m } from "framer-motion";
import { MoreHorizontalIcon } from "lucide-react";
import { useTranslation } from "next-i18next";
import * as React from "react";
import smoothscroll from "smoothscroll-polyfill";

import { ParticipantDropdown } from "@/components/participant-dropdown";
import { useVotingForm } from "@/components/poll/voting-form";
import { useOptions, usePoll } from "@/components/poll-context";
import { usePermissions } from "@/contexts/permissions";

import { useVisibleParticipants } from "../participants-provider";
import { useUser } from "../user-provider";
import GroupedOptions from "./mobile-poll/grouped-options";
import UserAvatar, { YouAvatar } from "./user-avatar";

if (typeof window !== "undefined") {
  smoothscroll.polyfill();
}

const MobilePoll: React.FunctionComponent = () => {
  const pollContext = usePoll();

  const { getParticipantById } = pollContext;

  const { options } = useOptions();

  const session = useUser();

  const votingForm = useVotingForm();
  const { formState } = votingForm;

  const selectedParticipantId = votingForm.watch("participantId") ?? "";

  const visibleParticipants = useVisibleParticipants();
  const selectedParticipant = selectedParticipantId
    ? getParticipantById(selectedParticipantId)
    : undefined;

  const { canEditParticipant } = usePermissions();

  const { t } = useTranslation();

  const isEditing = votingForm.watch("mode") !== "view";

  return (
    <div>
      <div className="flex flex-col space-y-2 border-b bg-gray-50 p-2">
        <div className="flex space-x-2">
          {selectedParticipantId || !isEditing ? (
            <Select
              value={selectedParticipantId}
              onValueChange={(participantId) => {
                votingForm.setValue("participantId", participantId);
              }}
              disabled={isEditing}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  {t("selectParticipant", {
                    defaultValue: "Select Participant…",
                  })}
                </SelectItem>
                {visibleParticipants.map((participant) => (
                  <SelectItem key={participant.id} value={participant.id}>
                    <div className="flex items-center gap-x-2.5">
                      <UserAvatar
                        name={participant.name}
                        showName={true}
                        isYou={session.ownsObject(participant)}
                      />
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          ) : null}
        </div>
      </div>
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
    </div>
  );
};

export default MobilePoll;
