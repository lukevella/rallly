"use client";

import { useFormContext } from "react-hook-form";
import { isAllDay } from "@/features/poll/components/forms/poll-options-form/utils";
import type { PollOptionsData } from "@/features/poll/components/forms/types";
import { Trans } from "@/i18n/client";

/** How many dates or times the poll form currently has selected. */
export const SelectedOptionsCount = () => {
  const form = useFormContext<PollOptionsData>();
  const options = form.watch("options");
  const optionCount = options.length;

  if (isAllDay(options)) {
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
