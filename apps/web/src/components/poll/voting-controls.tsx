"use client";

import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import { MoreVerticalIcon, PlusIcon, UsersIcon } from "lucide-react";

import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { Participant, ParticipantName } from "@/components/participant";
import { ParticipantDropdown } from "@/components/participant-dropdown";
import { useVotingForm } from "@/components/poll/voting-form";
import { YouAvatar } from "@/components/poll/you-avatar";
import { usePermissions } from "@/contexts/permissions";
import { Trans, useTranslation } from "@/i18n/client";

import { useVisibleParticipants } from "../participants-provider";
import { useUser } from "../user-provider";

/**
 * Participant picker + add/edit/cancel controls for the voting form. Shared by
 * the mobile poll and the calendar view so voting works identically in both.
 */
export function VotingControlBar() {
  const votingForm = useVotingForm();
  const session = useUser();
  const { t } = useTranslation();
  const { canEditParticipant, canAddNewParticipant } = usePermissions();

  const selectedParticipantId = votingForm.watch("participantId");
  const isEditing = votingForm.watch("mode") !== "view";

  const visibleParticipants = useVisibleParticipants();
  const selectedParticipant = selectedParticipantId
    ? visibleParticipants.find(
        (participant) => participant.id === selectedParticipantId,
      )
    : undefined;

  return (
    <div className="flex gap-x-2.5">
      {selectedParticipantId || !isEditing ? (
        <Select
          defaultValue="all"
          value={selectedParticipantId}
          onValueChange={(participantId) => {
            votingForm.setValue("participantId", participantId);
          }}
          disabled={isEditing}
        >
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-x-2.5">
                <div>
                  <Icon>
                    <UsersIcon />
                  </Icon>
                </div>
                <span>
                  {t("allParticipants", {
                    defaultValue: "All Participants",
                  })}
                </span>
              </div>
            </SelectItem>
            {visibleParticipants.map((participant) => (
              <SelectItem key={participant.id} value={participant.id}>
                <Participant>
                  <OptimizedAvatarImage
                    name={participant.name}
                    src={participant.image ?? undefined}
                    size="sm"
                  />
                  <ParticipantName>{participant.name}</ParticipantName>
                  {session.ownsObject(participant) && (
                    <Badge>
                      <Trans i18nKey="you" />
                    </Badge>
                  )}
                </Participant>
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
          <Button
            aria-label={t("moreOptions", { defaultValue: "More options" })}
            size="icon"
          >
            <MoreVerticalIcon />
          </Button>
        </ParticipantDropdown>
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
  );
}

/**
 * Submit button for the voting form. Targets the shared `voting-form` element so
 * it can live anywhere in the tree (mobile footer, calendar footer, etc.).
 */
export function VotingSubmitButton({ className }: { className?: string }) {
  const votingForm = useVotingForm();
  const { t } = useTranslation();
  const selectedParticipantId = votingForm.watch("participantId");

  return (
    <Button
      form="voting-form"
      className={className}
      type="submit"
      variant="primary"
      size="lg"
      loading={votingForm.formState.isSubmitting}
    >
      {selectedParticipantId ? t("save") : t("continue")}
    </Button>
  );
}
