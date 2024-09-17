import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@rallly/ui/card";
import { Icon } from "@rallly/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import { AnimatePresence, m } from "framer-motion";
import { MoreHorizontalIcon, PlusIcon, UsersIcon } from "lucide-react";
import { useTranslation } from "next-i18next";
import * as React from "react";
import smoothscroll from "smoothscroll-polyfill";

import { TimesShownIn } from "@/components/clock";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { Participant, ParticipantName } from "@/components/participant";
import { ParticipantDropdown } from "@/components/participant-dropdown";
import { useVotingForm } from "@/components/poll/voting-form";
import { YouAvatar } from "@/components/poll/you-avatar";
import { useOptions, usePoll } from "@/components/poll-context";
import { Trans } from "@/components/trans";
import { usePermissions } from "@/contexts/permissions";

import { useVisibleParticipants } from "../participants-provider";
import { useUser } from "../user-provider";
import GroupedOptions from "./mobile-poll/grouped-options";

if (typeof window !== "undefined") {
  smoothscroll.polyfill();
}

const MobilePoll: React.FunctionComponent = () => {
  const pollContext = usePoll();

  const { poll, getParticipantById } = pollContext;

  const { options } = useOptions();

  const session = useUser();

  const votingForm = useVotingForm();
  const { formState } = votingForm;

  const selectedParticipantId = votingForm.watch("participantId") ?? "";

  const visibleParticipants = useVisibleParticipants();
  const selectedParticipant = selectedParticipantId
    ? getParticipantById(selectedParticipantId)
    : undefined;

  const { canEditParticipant, canAddNewParticipant } = usePermissions();

  const { t } = useTranslation();

  const isEditing = votingForm.watch("mode") !== "view";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-x-2.5">
          <CardTitle>
            <Trans i18nKey="participants" />
          </CardTitle>
          <Badge>{visibleParticipants.length}</Badge>
        </div>
      </CardHeader>

      <div className="sticky top-0 z-20 flex flex-col space-y-2 border-b bg-gray-50 p-2">
        <div className="flex gap-x-2.5">
          {selectedParticipantId || !isEditing ? (
            <Select
              value={selectedParticipantId}
              onValueChange={(participantId) => {
                votingForm.setValue("participantId", participantId);
              }}
              disabled={isEditing}
            >
              <SelectTrigger asChild className="w-full">
                <Button>
                  <SelectValue />
                </Button>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  <div className="flex items-center gap-x-2.5">
                    <div className="flex w-5 justify-center">
                      <Icon>
                        <UsersIcon />
                      </Icon>
                    </div>
                    <span className="font-medium">
                      {t("allParticipants", {
                        defaultValue: "All Participants",
                      })}
                    </span>
                  </div>
                </SelectItem>
                {visibleParticipants.map((participant) => (
                  <SelectItem key={participant.id} value={participant.id}>
                    <div className="flex items-center gap-x-2.5">
                      <Participant>
                        <OptimizedAvatarImage
                          name={participant.name}
                          size={20}
                        />
                        <ParticipantName>{participant.name}</ParticipantName>
                        {session.ownsObject(participant) && (
                          <Badge>
                            <Trans i18nKey="you" />
                          </Badge>
                        )}
                      </Participant>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex grow items-center px-1">
              <Participant>
                <YouAvatar />
                <ParticipantName>{t("you")}</ParticipantName>
              </Participant>
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
              participant={{
                name: selectedParticipant.name,
                userId: selectedParticipant.userId ?? undefined,
                email: selectedParticipant.email ?? undefined,
                id: selectedParticipant.id,
              }}
              onEdit={() => {
                votingForm.setEditingParticipantId(selectedParticipant.id);
              }}
            >
              <Button>
                <Icon>
                  <MoreHorizontalIcon />
                </Icon>
              </Button>
            </ParticipantDropdown>
          ) : canAddNewParticipant ? (
            <Button
              onClick={() => {
                votingForm.newParticipant();
              }}
            >
              <Icon>
                <PlusIcon />
              </Icon>
            </Button>
          ) : null}
        </div>
      </div>
      {poll.options[0]?.duration !== 0 && poll.timeZone ? (
        <CardHeader>
          <TimesShownIn />
        </CardHeader>
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
            <CardFooter>
              <Button
                form="voting-form"
                className="w-full"
                type="submit"
                variant="primary"
                loading={formState.isSubmitting}
              >
                {selectedParticipantId ? t("save") : t("continue")}
              </Button>
            </CardFooter>
          </m.div>
        ) : null}
      </AnimatePresence>
    </Card>
  );
};

export default MobilePoll;
