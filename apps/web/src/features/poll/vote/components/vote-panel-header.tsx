"use client";
import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { MoreHorizontalIcon, TagIcon, TrashIcon } from "lucide-react";
import { TimesShownIn } from "@/components/clock";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import {
  ChangeNameModal,
  DeleteParticipantModal,
} from "@/features/poll/components/participant-dropdown";
import { useVoteForm } from "@/features/poll/vote/components/vote-form";
import type { VotePageView } from "@/features/poll/vote/types";
import { Trans, useTranslation } from "@/i18n/client";

/**
 * While composing a response the header carries the prompt; once a response
 * is saved it names the participant with their avatar, an overflow menu for
 * renaming and deleting, and Edit. Display settings sit on the right for
 * zoned time polls.
 */
export function VotePanelHeader({
  poll,
  results,
  response,
  canVote,
}: {
  poll: VotePageView["poll"];
  results: VotePageView["results"];
  response: VotePageView["response"];
  canVote: boolean;
}) {
  const { t } = useTranslation();
  const form = useVoteForm();
  const mode = form.watch("mode");
  const changeNameDialog = useDialog();
  const deleteDialog = useDialog();

  const isTimeSlot = (results[0]?.duration ?? 0) > 0;
  // Floating-time polls have no zone to switch, and dates have no time
  // format, so the control only appears on zoned time polls.
  const displaySettings = isTimeSlot && poll.timeZone ? <TimesShownIn /> : null;

  if (response && mode === "view") {
    return (
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <OptimizedAvatarImage
            size="sm"
            name={response.name}
            src={response.image ?? undefined}
            className="shrink-0"
          />
          <p className="truncate font-medium text-sm">{response.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {displaySettings}
          {canVote ? (
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
                  {/* Removing the response entirely is rarer than changing
                      it to a no, so it sits in the menu rather than beside
                      Edit. */}
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => deleteDialog.trigger()}
                  >
                    <TrashIcon />
                    <Trans i18nKey="delete" defaults="Delete" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                onClick={() => {
                  form.reset({
                    mode: "edit",
                    votes: results.map((result) => ({
                      optionId: result.optionId,
                      type: response.votes.find(
                        (vote) => vote.optionId === result.optionId,
                      )?.type,
                    })),
                  });
                }}
              >
                <Trans i18nKey="edit" defaults="Edit" />
              </Button>
              <ChangeNameModal
                {...changeNameDialog.dialogProps}
                oldName={response.name}
                participantId={response.participantId}
              />
              <DeleteParticipantModal
                {...deleteDialog.dialogProps}
                participantId={response.participantId}
                participantName={response.name}
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
