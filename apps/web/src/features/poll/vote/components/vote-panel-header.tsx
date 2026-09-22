"use client";
import { HidePastToggle } from "@/features/poll/vote/components/hide-past-toggle";
import { TimeFormatSwitcher } from "@/features/poll/vote/components/time-format-switcher";
import { TimeZoneSwitcher } from "@/features/poll/vote/components/time-zone-switcher";
import { VoteViewSwitcher } from "@/features/poll/vote/components/vote-view-switcher";
import type { VotePageView, VoteViewId } from "@/features/poll/vote/types";

/**
 * The panel's controls: what is shown on the left, how it is shown on the
 * right. Filtering lives on the left, display settings on the right; the
 * response itself belongs to the footer.
 */
export function VotePanelHeader({
  poll,
  results,
  views,
  view,
  onViewChange,
  pastCount,
  hidePast,
  onHidePastChange,
}: {
  poll: VotePageView["poll"];
  results: VotePageView["results"];
  /** The views this poll offers; the switcher is hidden below two. */
  views: VoteViewId[];
  view: VoteViewId;
  onViewChange: (view: VoteViewId) => void;
  /** How many options have already passed; the filter hides itself at zero. */
  pastCount: number;
  hidePast: boolean;
  onHidePastChange: (hidePast: boolean) => void;
}) {
  const isTimeSlot = (results[0]?.duration ?? 0) > 0;
  // Floating-time polls have no zone to switch, so the zone picker only
  // appears on zoned time polls. Only a time poll has a format to set.
  const showClock = isTimeSlot && poll.timeZone !== null;
  const showTimeFormat = isTimeSlot;
  const showViewSwitcher = views.length > 1;
  // Nothing to hide on a poll whose options are all still ahead.
  const showHidePast = pastCount > 0;

  const hasFilters = showHidePast;
  const hasDisplaySettings = showClock || showTimeFormat || showViewSwitcher;

  if (!hasFilters && !hasDisplaySettings) {
    return null;
  }

  return (
    <header // Below lg the page scrolls, so the header pins to the viewport; from
      // lg up the panel's own layout places it. Below sm the two groups take
      // a line each rather than squeezing onto one.
      // px-1.5 rather than px-4: every control here is a button carrying
      // its own px-2.5, so the two together put the label at the same 16px
      // from the card edge as the footer's text.
      className="sticky top-0 z-20 flex min-h-14 shrink-0 flex-col items-stretch gap-2 border-b bg-card px-1.5 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:static lg:bg-transparent"
    >
      <div
        data-testid="filters"
        className="flex min-w-0 items-center gap-2 empty:hidden"
      >
        {showHidePast ? (
          <HidePastToggle
            checked={hidePast}
            onCheckedChange={onHidePastChange}
            isTimeSlot={isTimeSlot}
          />
        ) : null}
      </div>
      {hasDisplaySettings ? (
        <div
          data-testid="display-settings"
          // ms-auto rather than relying on justify-between: the filters
          // group hides itself when empty, and with one child left
          // justify-between puts it at the start.
          className="flex shrink-0 items-center justify-end gap-2 sm:ms-auto"
        >
          {showViewSwitcher ? (
            <VoteViewSwitcher
              views={views}
              value={view}
              onChange={onViewChange}
            />
          ) : null}
          {showClock ? <TimeZoneSwitcher /> : null}
          {showTimeFormat ? <TimeFormatSwitcher /> : null}
        </div>
      ) : null}
    </header>
  );
}
