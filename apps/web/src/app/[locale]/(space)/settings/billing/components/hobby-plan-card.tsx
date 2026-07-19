"use client";

import { posthog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import { showPayWall } from "@/features/billing/client";
import {
  SpaceTierIcon,
  SpaceTierLabel,
} from "@/features/space/components/space-tier";
import { Trans } from "@/i18n/client";
import {
  PlanCard,
  PlanCardContent,
  PlanCardDescription,
  PlanCardFooter,
  PlanCardHeader,
  PlanCardIcon,
  PlanCardPrice,
  PlanCardPriceValue,
  PlanCardTitle,
} from "./plan-card";

export function HobbyPlanCard({ className }: { className?: string }) {
  return (
    <PlanCard className={className}>
      <PlanCardHeader>
        <PlanCardIcon>
          <SpaceTierIcon tier="hobby" />
        </PlanCardIcon>
        <PlanCardContent>
          <PlanCardTitle>
            <SpaceTierLabel tier="hobby" />
          </PlanCardTitle>
          <PlanCardDescription>
            <Trans
              i18nKey="seatCount"
              defaults="{count, plural, one {# seat} other {# seats}}"
              values={{ count: 1 }}
            />
          </PlanCardDescription>
        </PlanCardContent>
        <PlanCardPrice>
          <PlanCardPriceValue>
            <Trans i18nKey="priceFree" defaults="Free" />
          </PlanCardPriceValue>
        </PlanCardPrice>
      </PlanCardHeader>
      <PlanCardFooter>
        <Button
          variant="primary"
          onClick={() => {
            showPayWall();
            posthog?.capture("space_billing:upgrade_button_click");
          }}
        >
          <Trans i18nKey="upgradeToPro" defaults="Upgrade to Pro" />
        </Button>
      </PlanCardFooter>
    </PlanCard>
  );
}
