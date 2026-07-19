import { Icon } from "@rallly/ui/icon";
import { DotIcon } from "lucide-react";
import { SubscriptionStatusBadge } from "@/features/billing/components/subscription-status-badge";
import type {
  BillingInterval,
  SubscriptionStatus,
} from "@/features/billing/schema";
import { SpaceTierIcon } from "@/features/space/components/space-tier";
import { getTranslation } from "@/i18n/server";
import { getLocale } from "@/i18n/server/get-locale";
import {
  PlanCard,
  PlanCardContent,
  PlanCardDescription,
  PlanCardFooter,
  PlanCardHeader,
  PlanCardIcon,
  PlanCardPrice,
  PlanCardPriceDescription,
  PlanCardPriceValue,
  PlanCardTitle,
} from "./plan-card";
import { SubscriptionActions } from "./subscription-actions";
import { SubscriptionPeriodEnd } from "./subscription-period-end";

export async function ProPlanCard({
  amount,
  currency,
  interval,
  seats,
  usedSeats,
  status,
  cancelAtPeriodEnd,
  periodEnd,
  className,
}: {
  amount: number;
  currency: string;
  interval: BillingInterval;
  seats: number;
  usedSeats: number;
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  periodEnd: Date;
  className?: string;
}) {
  const [{ t }, locale] = await Promise.all([getTranslation(), getLocale()]);

  // amount is the per-seat unit amount in the currency's minor unit
  const price = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format((amount * seats) / 100);

  return (
    <PlanCard className={className}>
      <PlanCardHeader>
        <PlanCardIcon>
          <SpaceTierIcon tier="pro" />
        </PlanCardIcon>
        <PlanCardContent>
          <div className="flex items-center gap-x-2">
            <PlanCardTitle>Pro</PlanCardTitle>
            <SubscriptionStatusBadge status={status} />
          </div>
          <PlanCardDescription className="flex items-center">
            {t("seatCount", {
              count: seats,
              defaultValue: "{count, plural, one {# seat} other {# seats}}",
            })}
            <Icon>
              <DotIcon />
            </Icon>
            <SubscriptionPeriodEnd
              status={status}
              cancelAtPeriodEnd={cancelAtPeriodEnd}
              periodEnd={periodEnd}
            />
          </PlanCardDescription>
        </PlanCardContent>
        <PlanCardPrice>
          <PlanCardPriceValue>{price}</PlanCardPriceValue>
          <PlanCardPriceDescription>
            {interval === "month"
              ? t("subscriptionCardPerMonth", { defaultValue: "per month" })
              : t("subscriptionCardPerYear", { defaultValue: "per year" })}
          </PlanCardPriceDescription>
        </PlanCardPrice>
      </PlanCardHeader>
      <PlanCardFooter>
        <SubscriptionActions usedSeats={usedSeats} totalSeats={seats} />
      </PlanCardFooter>
    </PlanCard>
  );
}
