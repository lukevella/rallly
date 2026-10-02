"use client";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@rallly/ui/segmented-control";
import { CalendarIcon, ColumnsIcon, ListIcon } from "lucide-react";
import type { VoteViewId } from "@/features/poll/vote/types";
import { useTranslation } from "@/i18n/client";

const icons: Record<VoteViewId, typeof ListIcon> = {
  list: ListIcon,
  calendar: CalendarIcon,
  week: ColumnsIcon,
};

/**
 * Picks the voting view. The views share a props interface and read their
 * votes from the form context, so switching keeps the selection. Which
 * views exist is the panel's call, since it depends on the poll's shape.
 */
export function VoteViewSwitcher({
  views,
  value,
  onChange,
}: {
  views: VoteViewId[];
  value: VoteViewId;
  onChange: (value: VoteViewId) => void;
}) {
  const { t } = useTranslation();

  const labels: Record<VoteViewId, string> = {
    list: t("voteViewList", { defaultValue: "List" }),
    calendar: t("voteViewCalendar", { defaultValue: "Calendar" }),
    week: t("voteViewWeek", { defaultValue: "Week" }),
  };

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
      {views.map((view) => {
        const Icon = icons[view];
        return (
          <SegmentedControlItem
            key={view}
            value={view}
            aria-label={labels[view]}
            className="w-9"
          >
            <Icon className="size-4" />
          </SegmentedControlItem>
        );
      })}
    </SegmentedControl>
  );
}
