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
import { VoteViewSwitcher } from "@/features/poll/vote/components/vote-view-switcher";
import type { VotePageView, VoteViewId } from "@/features/poll/vote/types";
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
  views,
  view,
  onViewChange,
}: {
  poll: VotePageView["poll"];
  results: VotePageView["results"];
  response: VotePageView["response"];
  canVote: boolean;
  /** The views this poll offers; the switcher is hidden below two. */
  views: VoteViewId[];
  view: VoteViewId;
  onViewChange: (view: VoteViewId) => void;
}) {
  const { t } = useTranslation();
  const form = useVoteForm();
  const mode = form.watch("mode");
  const changeNameDialog = useDialog();
  const deleteDialog = useDialog();

  const isTimeSlot = (results[0]?.duration ?? 0) > 0;
  // Floating-time polls have no zone to switch, and dates have no time
  // format, so the clock only appears on zoned time polls.
  const showClock = isTimeSlot && poll.timeZone !== null;
  const showViewSwitcher = views.length > 1;
  const hasDisplaySettings = showClock || showViewSwitcher;
  const displaySettings = (
    <>
      {showViewSwitcher ? (
        <VoteViewSwitcher value={view} onChange={onViewChange} />
      ) : null}
      {showClock ? <TimesShownIn /> : null}
    </>
  );

  if (response && mode === "view") {
    return (
      <header // Below lg the page scrolls, so the header pins to the viewport; from
        // lg up the panel's own layout places it. Below sm the name and the
        // controls take a line each rather than squeezing onto one.
        className="sticky top-0 z-20 flex min-h-14 shrink-0 flex-col items-stretch gap-2 border-b bg-card px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:static lg:bg-transparent"
      >
        <div className="flex min-w-0 items-center gap-2">
          <OptimizedAvatarImage
            size="sm"
            name={response.name}
            src={response.image ?? undefined}
            className="shrink-0"
          />
          <p className="truncate font-medium text-sm">{response.name}</p>
        </div>
        <div className="flex items-center justify-end gap-2">
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
    <header // Below lg the page scrolls, so the header pins to the viewport; from
      // lg up the panel's own layout places it. Below sm the prompt and the
      // controls take a line each: side by side, the prompt wraps to three.
      className="sticky top-0 z-20 flex min-h-14 shrink-0 flex-col items-stretch gap-2 border-b bg-card px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:static lg:bg-transparent"
    >
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
      {hasDisplaySettings ? (
        <div
          data-testid="display-settings"
          className="flex shrink-0 items-center justify-end gap-2"
        >
          {displaySettings}
        </div>
      ) : null}
    </header>
  );
}
