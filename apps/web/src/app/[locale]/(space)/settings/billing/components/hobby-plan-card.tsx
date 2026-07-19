import { SpaceTierIcon } from "@/features/space/components/space-tier";
import { getTranslation } from "@/i18n/server";
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
import { UpgradePlanButton } from "./upgrade-plan-button";

export async function HobbyPlanCard({ className }: { className?: string }) {
  const { t } = await getTranslation();

  return (
    <PlanCard className={className}>
      <PlanCardHeader>
        <PlanCardIcon>
          <SpaceTierIcon tier="hobby" />
        </PlanCardIcon>
        <PlanCardContent>
          <PlanCardTitle>Hobby</PlanCardTitle>
          <PlanCardDescription>
            {t("seatCount", {
              count: 1,
              defaultValue: "{count, plural, one {# seat} other {# seats}}",
            })}
          </PlanCardDescription>
        </PlanCardContent>
        <PlanCardPrice>
          <PlanCardPriceValue>
            {t("priceFree", { defaultValue: "Free" })}
          </PlanCardPriceValue>
        </PlanCardPrice>
      </PlanCardHeader>
      <PlanCardFooter>
        <UpgradePlanButton />
      </PlanCardFooter>
    </PlanCard>
  );
}
