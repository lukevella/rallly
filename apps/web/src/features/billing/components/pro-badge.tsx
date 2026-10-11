"use client";

import { Badge } from "@rallly/ui/badge";
import { useIsFree, useTrial, useTrialState } from "@/features/billing/client";
import { PLAN_NAMES } from "@/features/billing/constants";
import { Trans } from "@/i18n/client";

export const ProBadge = ({ className }: { className?: string }) => {
  return (
    <Badge size="sm" variant="secondary" className={className}>
      {PLAN_NAMES.PRO}
    </Badge>
  );
};

/**
 * The badge on a paid action inside the organiser's journey (Schedule and
 * Duplicate in the Manage menu). It says what the press does: "Free for
 * 14 days" before a trial, nothing while it runs or the space pays, "Pro"
 * once the trial has ended. A guest organiser, who has no space to hold a
 * trial, keeps the plain Pro badge as before. The space settings screens
 * keep the plain ProBadge.
 */
export const TrialProBadge = ({ className }: { className?: string }) => {
  const trialState = useTrialState();
  const { hasSpace } = useTrial();
  const isFree = useIsFree();

  if (!hasSpace) {
    return isFree ? <ProBadge className={className} /> : null;
  }

  switch (trialState) {
    case "eligible":
      return (
        <Badge size="sm" variant="secondary" className={className}>
          <Trans i18nKey="freeForFourteenDays" defaults="Free for 14 days" />
        </Badge>
      );
    case "ended":
      return <ProBadge className={className} />;
    default:
      return null;
  }
};
