"use client";

import { Button } from "@rallly/ui/button";
import { showPayWall } from "@/features/billing/client";
import { SpaceTierLabel } from "@/features/space/components/space-tier";
import { Trans } from "@/i18n/client";
import {
  PlanCard,
  PlanCardActions,
  PlanCardContent,
  PlanCardDescription,
  PlanCardHeader,
  PlanCardHeading,
  PlanCardHeadingDescription,
  PlanCardHeadingTitle,
  PlanCardTitle,
} from "./plan-card";

export function HobbyPlanCard({ className }: { className?: string }) {
  return (
    <PlanCard className={className}>
      <PlanCardHeading>
        <PlanCardHeadingTitle>
          <Trans i18nKey="billingPlanTitle" defaults="Plan" />
        </PlanCardHeadingTitle>
        <PlanCardHeadingDescription>
          <Trans
            i18nKey="billingSubscriptionDescription"
            defaults="Manage your current subscription plan."
          />
        </PlanCardHeadingDescription>
      </PlanCardHeading>
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
          <Button
            variant="primary"
            onClick={() => {
              showPayWall({ from: "billing-settings" });
            }}
          >
            <Trans i18nKey="upgrade" defaults="Upgrade" />
          </Button>
        </PlanCardActions>
      </PlanCardHeader>
    </PlanCard>
  );
}
