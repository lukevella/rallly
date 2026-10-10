"use client";

import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import {
  useProMonthlyPrice,
  useTrial,
  useTrialState,
} from "@/features/billing/client";
import { getTrialEndDate } from "@/features/billing/trial/utils";
import { Trans } from "@/i18n/client";
import { useDateTime } from "@/lib/datetime/client";

/**
 * The terms of the 14 free days, inside the dialog of the paid action that
 * would start them: what is part of Pro, how long, what it costs after,
 * what happens to the poll. After the trial it says when it ended, and the
 * dialog's button carries the price. Nothing while the trial runs or the
 * space pays: the action simply works.
 */
export function TrialTerms({ action }: { action: "schedule" | "duplicate" }) {
  const trialState = useTrialState();
  const { trialEndsAt } = useTrial();
  const price = useProMonthlyPrice();
  const { formatDateTime } = useDateTime();

  if (trialState !== "eligible" && trialState !== "ended") {
    return null;
  }

  // The end is counted from the press, so the date shown is the date the
  // action would write. Computed on the client, where "now" is the viewer's.
  const endsAt =
    trialState === "eligible" ? getTrialEndDate(new Date()) : trialEndsAt;

  return (
    <Alert variant="primary">
      <AlertTitle>
        {action === "schedule" ? (
          <Trans
            i18nKey="trialTermsScheduleTitle"
            defaults="Scheduling is part of Pro."
          />
        ) : (
          <Trans
            i18nKey="trialTermsDuplicateTitle"
            defaults="Duplicating is part of Pro."
          />
        )}
      </AlertTitle>
      <AlertDescription>
        {trialState === "ended" && endsAt ? (
          <Trans
            i18nKey="trialEndedOn"
            defaults="Your 14 free days ended on {date}."
            values={{ date: formatDateTime(endsAt, "monthDay") }}
          />
        ) : action === "schedule" && endsAt ? (
          <Trans
            i18nKey="trialTermsSchedule"
            defaults="14 free days, no card, ends {date}. After that, {price} a month to keep Pro, or scheduling stops. Your poll and answers stay."
            values={{ date: formatDateTime(endsAt, "monthDay"), price }}
          />
        ) : endsAt ? (
          <Trans
            i18nKey="trialTermsDuplicate"
            defaults="14 free days, no card, ends {date}. After that, {price} a month to keep Pro."
            values={{ date: formatDateTime(endsAt, "monthDay"), price }}
          />
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
