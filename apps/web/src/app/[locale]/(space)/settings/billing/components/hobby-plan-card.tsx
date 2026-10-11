"use client";

import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { toast } from "@rallly/ui/sonner";
import {
  showPayWall,
  useProMonthlyPrice,
  useTrial,
  useTrialState,
} from "@/features/billing/client";
import { UpgradeButton } from "@/features/billing/components/upgrade-button";
import { startTrial } from "@/features/billing/trial/actions";
import { SpaceTierLabel } from "@/features/space/components/space-tier";
import { Trans, useTranslation } from "@/i18n/client";
import { useDateTime } from "@/lib/datetime/client";
import { useSafeAction } from "@/lib/safe-action/client";
import {
  PlanCard,
  PlanCardActions,
  PlanCardContent,
  PlanCardDescription,
  PlanCardHeader,
  PlanCardTitle,
} from "./plan-card";

/**
 * The plan card while nothing is paying for the space. One Upgrade button
 * that carries the trial: before a trial a badge beside it says so and the
 * press starts the 14 free days, no checkout; during the trial the card
 * reads the end date and offers to keep Pro; after it, Upgrade opens the
 * plan window as it always did.
 */
export function HobbyPlanCard({ className }: { className?: string }) {
  const trialState = useTrialState();
  const { trialEndsAt } = useTrial();
  const price = useProMonthlyPrice();
  const { formatDateTime } = useDateTime();
  const { t } = useTranslation();
  const start = useSafeAction(startTrial, {
    onSuccess: ({ data }) => {
      if (data) {
        toast.success(
          t("trialStartedToast", {
            defaultValue:
              "Your 14 free days of Pro started, free until {date}.",
            date: formatDateTime(data.endsAt, "monthDay"),
          }),
        );
      }
    },
  });

  if (trialState === "trial" && trialEndsAt) {
    return (
      <PlanCard className={className}>
        <PlanCardHeader>
          <PlanCardContent>
            <PlanCardTitle>
              <SpaceTierLabel tier="pro" />
            </PlanCardTitle>
            <PlanCardDescription>
              <Trans
                i18nKey="trialCardFreeUntil"
                defaults="Free until {date}."
                values={{ date: formatDateTime(trialEndsAt, "monthDay") }}
              />
            </PlanCardDescription>
          </PlanCardContent>
          <PlanCardActions>
            <UpgradeButton size="default" variant="default">
              <Trans
                i18nKey="keepProPrice"
                defaults="Keep Pro, {price} a month"
                values={{ price }}
              />
            </UpgradeButton>
          </PlanCardActions>
        </PlanCardHeader>
      </PlanCard>
    );
  }

  const canTry = trialState === "eligible";

  return (
    <PlanCard className={className}>
      <PlanCardHeader>
        <PlanCardContent>
          <PlanCardTitle>
            <SpaceTierLabel tier="hobby" />
          </PlanCardTitle>
          <PlanCardDescription>
            <Trans i18nKey="priceFree" defaults="Free" />
          </PlanCardDescription>
        </PlanCardContent>
        <PlanCardActions>
          {canTry ? (
            <Badge size="sm" variant="secondary">
              <Trans
                i18nKey="freeForFourteenDays"
                defaults="Free for 14 days"
              />
            </Badge>
          ) : null}
          <Button
            variant="primary"
            loading={start.isExecuting}
            onClick={() => {
              if (canTry) {
                start.execute({ source: "billing" });
              } else {
                showPayWall({ from: "billing-settings" });
              }
            }}
          >
            <Trans i18nKey="upgrade" defaults="Upgrade" />
          </Button>
        </PlanCardActions>
      </PlanCardHeader>
    </PlanCard>
  );
}
