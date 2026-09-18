"use client";
import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { MoreHorizontalIcon, TagIcon } from "lucide-react";
import { TimesShownIn } from "@/components/clock";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { usePermissions, usePoll } from "@/features/poll/client";
import {
  ChangeNameModal,
  DeleteParticipantModal,
} from "@/features/poll/components/participant-dropdown";
import { useVisibleParticipants } from "@/features/poll/components/visibility";
import { useVotingForm } from "@/features/poll/components/voting-form";
import { Trans, useTranslation } from "@/i18n/client";

/**
 * Header of the voting interface. While composing a response it carries
 * the prompt; once a response is saved it names the participant with their
 * avatar, an overflow menu for renaming, and Edit and Delete. Display
 * settings sit on the right for zoned time polls.
 */
export function VotingHeader() {
  const { t } = useTranslation();
  const poll = usePoll();
  const votingForm = useVotingForm();
  const mode = votingForm.watch("mode");
  const participantId = votingForm.watch("participantId");
  const { canEditParticipant } = usePermissions();
  const participants = useVisibleParticipants();
  const changeNameDialog = useDialog();
  const deleteDialog = useDialog();
  const isTimeSlot = (poll.options[0]?.duration ?? 0) > 0;
  // Floating-time polls have no zone to switch, and dates have no time
  // format, so the control only appears on zoned time polls.
  const displaySettings = isTimeSlot && poll.timeZone ? <TimesShownIn /> : null;

  const participant =
    mode === "view"
      ? participants.find((p) => p.id === participantId)
      : undefined;

  if (participant) {
    const canEdit = canEditParticipant(participant.id);
    return (
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <OptimizedAvatarImage
            size="sm"
            name={participant.name}
            src={participant.image ?? undefined}
            className="shrink-0"
          />
          <p className="truncate font-medium text-sm">{participant.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {displaySettings}
          {canEdit ? (
            <>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger
                  data-testid="participant-menu"
                  render={
                    <Button
                      aria-label={t("moreOptions", {
                        defaultValue: "More options",
                      })}
                      variant="ghost"
                      size="icon"
                    >
                      <MoreHorizontalIcon />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => changeNameDialog.trigger()}>
                    <TagIcon />
                    <Trans i18nKey="changeName" defaults="Change name" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                onClick={() => {
                  votingForm.setEditingParticipantId(participant.id);
                }}
              >
                <Trans i18nKey="edit" defaults="Edit" />
              </Button>
              {/* Plain rather than destructive: it sits in the header for
                  the whole session and its dialog already confirms. */}
              <Button onClick={() => deleteDialog.trigger()}>
                <Trans i18nKey="delete" defaults="Delete" />
              </Button>
              <ChangeNameModal
                {...changeNameDialog.dialogProps}
                oldName={participant.name}
                participantId={participant.id}
              />
              <DeleteParticipantModal
                {...deleteDialog.dialogProps}
                participantId={participant.id}
                participantName={participant.name}
                onDelete={() => {
                  votingForm.cancel();
                }}
              />
            </>
          ) : null}
        </div>
      </header>
    );
  }

  return (
    <header className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b px-4 py-2">
      <h2 className="font-medium text-sm">
        {isTimeSlot ? (
          <Trans
            i18nKey="votingPromptTimes"
            defaults="Please select as many times as possible"
          />
        ) : (
          <Trans
            i18nKey="votingPromptDates"
            defaults="Please select as many dates as possible"
          />
        )}
      </h2>
      {displaySettings}
    </header>
  );
}
