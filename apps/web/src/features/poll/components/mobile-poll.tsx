import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { Card, CardContent, CardFooter } from "@rallly/ui/card";
import { Icon } from "@rallly/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import { MoreHorizontalIcon, PlusIcon, UsersIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import type * as React from "react";
import smoothscroll from "smoothscroll-polyfill";

import { TimesShownIn } from "@/components/clock";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { usePermissions } from "@/features/poll/client";
import {
  Participant,
  ParticipantName,
} from "@/features/poll/components/participant";
import { ParticipantDropdown } from "@/features/poll/components/participant-dropdown";
import { ParticipantNote } from "@/features/poll/components/participant-note";
import { useOptions, usePoll } from "@/features/poll/components/poll-context";
import { useVisibleParticipants } from "@/features/poll/components/visibility";
import { useVotingForm } from "@/features/poll/components/voting-form";
import { YouAvatar } from "@/features/poll/components/you-avatar";
import { useUser } from "@/features/user/client";
import { Trans, useTranslation } from "@/i18n/client";
import GroupedOptions from "./mobile-poll/grouped-options";

if (typeof window !== "undefined") {
  smoothscroll.polyfill();
}

const MobilePoll: React.FunctionComponent = () => {
  const pollContext = usePoll();

  const { poll } = pollContext;

  const { options } = useOptions();

  const session = useUser();

  const votingForm = useVotingForm();
  const { formState } = votingForm;

  const selectedParticipantId = votingForm.watch("participantId");

  const visibleParticipants = useVisibleParticipants();
  const selectedParticipant = selectedParticipantId
    ? visibleParticipants.find(
        (participant) => participant.id === selectedParticipantId,
      )
    : undefined;

  const { canEditParticipant, canAddNewParticipant } = usePermissions();

  const isEditing = votingForm.watch("mode") !== "view";

  const { t } = useTranslation();

  const participantOptions = [
    {
      value: "all",
      label: (
        <div className="flex items-center gap-x-2.5">
          <div>
            <Icon>
              <UsersIcon />
            </Icon>
          </div>
          <span>
            {t("allParticipants", {
              defaultValue: "All participants",
            })}
          </span>
        </div>
      ),
    },
    ...visibleParticipants.map((participant) => ({
      value: participant.id,
      label: (
        <Participant>
          <OptimizedAvatarImage
            name={participant.name}
            src={participant.image ?? undefined}
            size="sm"
          />
          <ParticipantName>{participant.name}</ParticipantName>
          {session.ownsObject(participant) && (
            <Badge>
              <Trans i18nKey="you" defaults="You" />
            </Badge>
          )}
        </Participant>
      ),
    })),
  ];

  return (
    <Card>
      <div className="flex flex-col space-y-2 border-b p-2">
        <div className="flex gap-x-2.5">
          {selectedParticipantId || !isEditing ? (
            <Select
              items={participantOptions}
              defaultValue="all"
              value={selectedParticipantId}
              onValueChange={(participantId) => {
                if (participantId) {
                  votingForm.setValue("participantId", participantId);
                }
              }}
              disabled={isEditing}
            >
              <SelectTrigger
                className="flex-1"
                data-testid="participant-selector"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {participantOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex h-9 grow items-center px-1">
              <Participant>
                <YouAvatar />
                <ParticipantName>
                  {t("you", { defaultValue: "You" })}
                </ParticipantName>
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
            <>
              {selectedParticipant.note ? (
                <ParticipantNote
                  note={selectedParticipant.note}
                  participantName={selectedParticipant.name}
                  createdAt={selectedParticipant.createdAt}
                  size="icon"
                />
              ) : null}
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
                onDelete={() => {
                  votingForm.setValue("participantId", "all");
                }}
              >
                <Button
                  aria-label={t("moreOptions", {
                    defaultValue: "More options",
                  })}
                  size="icon"
                >
                  <MoreHorizontalIcon />
                </Button>
              </ParticipantDropdown>
            </>
          ) : canAddNewParticipant ? (
            <Button
              aria-label={t("addParticipant", {
                defaultValue: "Add participant",
              })}
              size="icon"
              onClick={() => {
                votingForm.newParticipant();
              }}
            >
              <PlusIcon />
            </Button>
          ) : null}
        </div>
      </div>
      {poll.options[0]?.duration !== 0 && poll.timeZone ? (
        <CardContent className="border-b">
          <TimesShownIn />
        </CardContent>
      ) : null}
      <GroupedOptions
        selectedParticipantId={selectedParticipantId}
        options={options}
        editable={isEditing}
        group={(option) => {
          if (option.type === "timeSlot") {
            return `${option.dow} ${option.day} ${option.month} ${option.year}`;
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
            <CardFooter className="border-t">
              <Button
                form="voting-form"
                className="w-full"
                type="submit"
                variant="primary"
                size="lg"
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
