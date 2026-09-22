"use client";
import { Button } from "@rallly/ui/button";
import { CalendarXIcon } from "lucide-react";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { Trans } from "@/i18n/client";

/**
 * Shown when the options list has nothing in it. The filtered case offers a
 * way back, since the viewer hid the options themselves and would otherwise
 * be looking at an empty panel with no obvious cause.
 */
export function VoteEmptyState({
  isTimeSlot,
  hiddenByFilter,
  onShowAll,
}: {
  isTimeSlot: boolean;
  /** True when options exist but the past filter is hiding all of them. */
  hiddenByFilter: boolean;
  onShowAll: () => void;
}) {
  return (
    <EmptyState className="flex-1 p-8">
      <EmptyStateIcon>
        <CalendarXIcon />
      </EmptyStateIcon>
      <EmptyStateTitle>
        {hiddenByFilter ? (
          isTimeSlot ? (
            <Trans i18nKey="allTimesPast" defaults="Every time has passed" />
          ) : (
            <Trans i18nKey="allDatesPast" defaults="Every date has passed" />
          )
        ) : isTimeSlot ? (
          <Trans i18nKey="noTimes" defaults="No times to vote on" />
        ) : (
          <Trans i18nKey="noDates" defaults="No dates to vote on" />
        )}
      </EmptyStateTitle>
      <EmptyStateDescription>
        {hiddenByFilter ? (
          <Trans
            i18nKey="allOptionsPastDescription"
            defaults="Turn off the filter to see them."
          />
        ) : (
          <Trans
            i18nKey="noOptionsDescription"
            defaults="The organizer hasn't added any options yet."
          />
        )}
      </EmptyStateDescription>
      {hiddenByFilter ? (
        <EmptyStateFooter>
          <Button type="button" onClick={onShowAll}>
            {isTimeSlot ? (
              <Trans i18nKey="showPastTimes" defaults="Show past times" />
            ) : (
              <Trans i18nKey="showPastDates" defaults="Show past dates" />
            )}
          </Button>
        </EmptyStateFooter>
      ) : null}
    </EmptyState>
  );
}
