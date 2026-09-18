"use client";
import { Button } from "@rallly/ui/button";
import { MoreHorizontalIcon } from "lucide-react";
import { TimesShownIn } from "@/components/clock";
import { usePermissions, usePoll } from "@/features/poll/client";
import { ParticipantDropdown } from "@/features/poll/components/participant-dropdown";
import { useVisibleParticipants } from "@/features/poll/components/visibility";
import { SelectionCount } from "@/features/poll/components/voting/voting-bar";
import { useVotingForm } from "@/features/poll/components/voting-form";
import { Trans, useTranslation } from "@/i18n/client";

/**
 * Header of the voting interface. While composing a response it
 * carries the prompt; once a response is saved it names the response with
 * its counts, Edit and the participant menu. Display settings sit on the
 * right for zoned time polls.
 */
export function VotingHeader() {
  const { t } = useTranslation();
  const poll = usePoll();
  const votingForm = useVotingForm();
  const mode = votingForm.watch("mode");
  const participantId = votingForm.watch("participantId");
  const { canEditParticipant } = usePermissions();
  const participants = useVisibleParticipants();
  const isTimeSlot = (poll.options[0]?.duration ?? 0) > 0;
  // Floating-time polls have no zone to switch, and dates have no time
  // format, so the control only appears on zoned time polls.
  const displaySettings = isTimeSlot && poll.timeZone ? <TimesShownIn /> : null;

  const participant =
    mode === "view"
      ? participants.find((p) => p.id === participantId)
      : undefined;

  if (participant) {
    const yes = participant.votes.filter((v) => v.type === "yes").length;
    const ifNeedBe = participant.votes.filter(
      (v) => v.type === "ifNeedBe",
    ).length;
    return (
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b px-4 py-2">
        <div className="min-w-0">
          <h2 className="truncate font-medium text-sm">{participant.name}</h2>
          <SelectionCount yesCount={yes} ifNeedBeCount={ifNeedBe} />
        </div>
        <div className="flex items-center gap-2">
          {displaySettings}
          {canEditParticipant(participant.id) ? (
            <>
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
