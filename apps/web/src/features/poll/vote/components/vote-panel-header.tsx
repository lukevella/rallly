"use client";
import { TimesShownIn } from "@/components/clock";
import { useVoteForm } from "@/features/poll/vote/components/vote-form";
import { VoteViewSwitcher } from "@/features/poll/vote/components/vote-view-switcher";
import type { VotePageView, VoteViewId } from "@/features/poll/vote/types";
import { Trans } from "@/i18n/client";

/**
 * The panel's display settings: which view is on screen and, for a zoned
 * time poll, the clock. The prompt sits here too while the viewer is still
 * composing. The response itself belongs to the footer.
 */
export function VotePanelHeader({
  poll,
  results,
  views,
  view,
  onViewChange,
}: {
  poll: VotePageView["poll"];
  results: VotePageView["results"];
  /** The views this poll offers; the switcher is hidden below two. */
  views: VoteViewId[];
  view: VoteViewId;
  onViewChange: (view: VoteViewId) => void;
}) {
  const form = useVoteForm();
  const mode = form.watch("mode");

  const isTimeSlot = (results[0]?.duration ?? 0) > 0;
  // Floating-time polls have no zone to switch, and dates have no time
  // format, so the clock only appears on zoned time polls.
  const showClock = isTimeSlot && poll.timeZone !== null;
  const showViewSwitcher = views.length > 1;
  const hasDisplaySettings = showClock || showViewSwitcher;
  // The prompt asks for a vote, so it goes once one is saved.
  const showPrompt = mode !== "view";

  if (!hasDisplaySettings && !showPrompt) {
    return null;
  }

  return (
    <header // Below lg the page scrolls, so the header pins to the viewport; from
      // lg up the panel's own layout places it. Below sm the prompt and the
      // controls take a line each: side by side, the prompt wraps to three.
      className="sticky top-0 z-20 flex min-h-14 shrink-0 flex-col items-stretch gap-2 border-b bg-card px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:static lg:bg-transparent"
    >
      {showPrompt ? (
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
      ) : (
        // Holds the settings at the trailing edge with no prompt beside them.
        <span />
      )}
      {hasDisplaySettings ? (
        <div
          data-testid="display-settings"
          className="flex shrink-0 items-center justify-end gap-2"
        >
          {showViewSwitcher ? (
            <VoteViewSwitcher value={view} onChange={onViewChange} />
          ) : null}
          {showClock ? <TimesShownIn /> : null}
        </div>
      ) : null}
    </header>
  );
}
