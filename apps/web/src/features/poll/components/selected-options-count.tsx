"use client";

import { useFormContext } from "react-hook-form";
import type { PollOptionsData } from "@/features/poll/components/forms/types";
import { Trans } from "@/i18n/client";

/** How many dates or times the poll form currently has selected. */
export const SelectedOptionsCount = () => {
  const form = useFormContext<PollOptionsData>();
  const optionCount = form.watch("options").length;
  const allDay = form.watch("allDay");

  if (allDay) {
    return (
      <Trans
        i18nKey="createPollFooterDatesSelected"
        defaults="{count, plural, =0 {No dates selected} one {1 date selected} other {# dates selected}}"
        values={{ count: optionCount }}
      />
    );
  }

  return (
    <Trans
      i18nKey="createPollFooterTimesSelected"
      defaults="{count, plural, =0 {No times selected} one {1 time selected} other {# times selected}}"
      values={{ count: optionCount }}
    />
  );
};
