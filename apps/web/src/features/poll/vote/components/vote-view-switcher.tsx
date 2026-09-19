"use client";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@rallly/ui/segmented-control";
import { CalendarIcon, ListIcon } from "lucide-react";
import type { VoteViewId } from "@/features/poll/vote/types";
import { useTranslation } from "@/i18n/client";

/**
 * Picks the voting view. The views share a props interface and read their
 * votes from the form context, so switching keeps the selection.
 */
export function VoteViewSwitcher({
  value,
  onChange,
}: {
  value: VoteViewId;
  onChange: (value: VoteViewId) => void;
}) {
  const { t } = useTranslation();

  return (
    <SegmentedControl
      aria-label={t("voteView", { defaultValue: "View" })}
      value={value}
      onValueChange={(next) => {
        if (next) {
          onChange(next as VoteViewId);
        }
      }}
    >
      <SegmentedControlItem
        value="list"
        aria-label={t("voteViewList", { defaultValue: "List" })}
        className="w-9"
      >
        <ListIcon className="size-4" />
      </SegmentedControlItem>
      <SegmentedControlItem
        value="calendar"
        aria-label={t("voteViewCalendar", { defaultValue: "Calendar" })}
        className="w-9"
      >
        <CalendarIcon className="size-4" />
      </SegmentedControlItem>
    </SegmentedControl>
  );
}
