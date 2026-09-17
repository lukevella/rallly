"use client";
import { Button } from "@rallly/ui/button";
import { MoreHorizontalIcon } from "lucide-react";
import { usePermissions, usePoll } from "@/features/poll/client";
import { ParticipantDropdown } from "@/features/poll/components/participant-dropdown";
import { useVisibleParticipants } from "@/features/poll/components/visibility";
import {
  DeclineButton,
  SubmitResponseButton,
  useSelectionCount,
} from "@/features/poll/components/voting-footer";
import { useVotingForm } from "@/features/poll/components/voting-form";
import { Trans, useTranslation } from "@/i18n/client";

function Bar({ children }: { children: React.ReactNode }) {
  return (
    <footer className="sticky bottom-0 z-10 flex min-h-16 items-center justify-between gap-4 border-t bg-card px-4 py-3">
      {children}
    </footer>
  );
}

function SelectionCount({
  yesCount,
  ifNeedBeCount,
}: {
  yesCount: number;
  ifNeedBeCount: number;
}) {
  const poll = usePoll();
  const { t } = useTranslation();
  return (
    <p aria-live="polite" className="text-muted-foreground text-sm">
      {poll.allowTentativeVotes
        ? t("optionVoteBreakdown", {
            defaultValue: "{yesScore} yes, {ifNeedBeScore} if need be",
            yesScore: yesCount,
            ifNeedBeScore: ifNeedBeCount,
          })
        : t("optionVoteBreakdownYesOnly", {
            defaultValue: "{yesScore} yes",
            yesScore: yesCount,
          })}
    </p>
  );
}

/**
 * Footer of the voting interface. While a response is being composed it
 * shows the live selection count with Decline and Continue (or Cancel and
 * Save for an existing response). Once saved it names the response with
 * Edit and the participant menu.
 */
export function VotingBar() {
  const { t } = useTranslation();
  const votingForm = useVotingForm();
  const mode = votingForm.watch("mode");
  const participantId = votingForm.watch("participantId");
  const { yesCount, ifNeedBeCount } = useSelectionCount();
  const { canAddNewParticipant, canEditParticipant } = usePermissions();
  const participants = useVisibleParticipants();

  if (mode === "view") {
    const participant = participants.find((p) => p.id === participantId);

    if (participant) {
      const yes = participant.votes.filter((v) => v.type === "yes").length;
      const ifNeedBe = participant.votes.filter(
        (v) => v.type === "ifNeedBe",
      ).length;
      const canEdit = canEditParticipant(participant.id);
      return (
        <Bar>
          <div className="min-w-0 text-sm">
            <p className="truncate font-medium">{participant.name}</p>
            <SelectionCount yesCount={yes} ifNeedBeCount={ifNeedBe} />
          </div>
          {canEdit ? (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  votingForm.setEditingParticipantId(participant.id);
                }}
              >
                <Trans i18nKey="edit" defaults="Edit" />
              </Button>
              <ParticipantDropdown
                align="end"
                participant={{
                  id: participant.id,
                  name: participant.name,
                  userId: participant.userId ?? undefined,
                  email: participant.email ?? undefined,
                  editUrl: participant.editUrl,
                }}
                onEdit={() => {
                  votingForm.setEditingParticipantId(participant.id);
                }}
                onDelete={() => {
                  votingForm.cancel();
                }}
              >
                <Button
                  aria-label={t("moreOptions", {
                    defaultValue: "More options",
                  })}
                  variant="ghost"
                  size="icon"
                >
                  <MoreHorizontalIcon />
                </Button>
              </ParticipantDropdown>
            </div>
          ) : null}
        </Bar>
      );
    }

    if (canAddNewParticipant) {
      return (
        <Bar>
          <span />
          <Button
            variant="primary"
            onClick={() => {
              votingForm.newParticipant();
            }}
          >
            <Trans i18nKey="newResponse" defaults="New response" />
          </Button>
        </Bar>
      );
    }

    return null;
  }

  return (
    <Bar>
      <SelectionCount yesCount={yesCount} ifNeedBeCount={ifNeedBeCount} />
      <div className="flex items-center gap-2">
        {mode === "edit" ? (
          <Button
            size="lg"
            onClick={() => {
              votingForm.setValue("mode", "view");
            }}
          >
            <Trans i18nKey="cancel" defaults="Cancel" />
          </Button>
        ) : (
          <DeclineButton />
        )}
        <SubmitResponseButton />
      </div>
    </Bar>
  );
}
