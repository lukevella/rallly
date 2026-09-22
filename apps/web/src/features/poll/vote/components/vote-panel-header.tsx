"use client";
import { Button } from "@rallly/ui/button";
import { EyeOffIcon } from "lucide-react";
import { TimeFormatSwitcher } from "@/features/poll/vote/components/time-format-switcher";
import { TimeZoneSwitcher } from "@/features/poll/vote/components/time-zone-switcher";
import { VoteViewSwitcher } from "@/features/poll/vote/components/vote-view-switcher";
import type { VotePageView, VoteViewId } from "@/features/poll/vote/types";
import { Trans } from "@/i18n/client";

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
      className="sticky top-0 z-20 flex min-h-14 shrink-0 flex-col items-stretch gap-2 border-b bg-card px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:static lg:bg-transparent"
    >
      <div
        data-testid="filters"
        className="flex min-w-0 items-center gap-2 empty:hidden"
      >
        {showHidePast ? (
          <Button
            type="button"
            variant={hidePast ? "primary" : "ghost"}
            aria-pressed={hidePast}
            onClick={() => onHidePastChange(!hidePast)}
          >
            <EyeOffIcon data-icon="inline-start" />
            {isTimeSlot ? (
              <Trans i18nKey="hidePastTimes" defaults="Hide past times" />
            ) : (
              <Trans i18nKey="hidePastDates" defaults="Hide past dates" />
            )}
          </Button>
        ) : null}
      </div>
      {hasDisplaySettings ? (
        <div
          data-testid="display-settings"
          className="flex shrink-0 items-center justify-end gap-2"
        >
          {showViewSwitcher ? (
            <VoteViewSwitcher value={view} onChange={onViewChange} />
          ) : null}
          {showClock ? <TimeZoneSwitcher /> : null}
          {showTimeFormat ? <TimeFormatSwitcher /> : null}
        </div>
      ) : null}
    </header>
  );
}
