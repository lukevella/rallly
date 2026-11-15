"use client";

import {
  SegmentedControl,
  SegmentedControlItem,
} from "@rallly/ui/segmented-control";
import { useFormContext } from "react-hook-form";
import { Trans } from "@/i18n/client";
import type { NewEventData } from "./types";

/** Switches the new poll form between asking for dates and asking for a place. */
export const PollTypeToggle = () => {
  const form = useFormContext<NewEventData>();
  const pollType = form.watch("pollType");

  return (
    <SegmentedControl
      aria-label="Poll type"
      value={pollType}
      onValueChange={(value) =>
        form.setValue("pollType", value as NewEventData["pollType"], {
          shouldDirty: true,
        })
      }
    >
      <SegmentedControlItem value="date" className="px-3 text-sm">
        <Trans i18nKey="pollTypeDates" defaults="Dates" />
      </SegmentedControlItem>
      <SegmentedControlItem value="location" className="px-3 text-sm">
        <Trans i18nKey="pollTypeLocation" defaults="Location" />
      </SegmentedControlItem>
    </SegmentedControl>
  );
};
