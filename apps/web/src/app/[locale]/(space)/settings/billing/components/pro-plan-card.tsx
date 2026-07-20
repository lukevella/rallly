"use client";

import { posthog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import { DialogTrigger } from "@rallly/ui/dialog";
import { Icon } from "@rallly/ui/icon";
import { ArmchairIcon, CreditCardIcon, DotIcon } from "lucide-react";
import { openCustomerPortalAction } from "@/features/billing/actions";
import { SubscriptionStatusBadge } from "@/features/billing/components/subscription-status-badge";
import type {
  BillingInterval,
  SubscriptionStatus,
} from "@/features/billing/schema";
import {
  SpaceTierIcon,
  SpaceTierLabel,
} from "@/features/space/components/space-tier";
import { Trans } from "@/i18n/client";
import { useDateTime, useDateTimeConfig } from "@/lib/datetime/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { ManageSeatsDialog } from "./manage-seats-dialog";
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

export function ProPlanCard({
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
  const { locale } = useDateTimeConfig();
  const { formatDateTime } = useDateTime();
  const openCustomerPortal = useSafeAction(openCustomerPortalAction);

  // amount is the per-seat unit amount in the currency's minor unit
  const price = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format((amount * seats) / 100);

  const date = formatDateTime(periodEnd, "date");
  const endsAtPeriodEnd = status === "canceled" || cancelAtPeriodEnd;

  return (
    <PlanCard className={className}>
      <PlanCardHeader>
        <PlanCardIcon>
          <SpaceTierIcon tier="pro" />
        </PlanCardIcon>
        <PlanCardContent>
          <div className="flex items-center gap-x-2">
            <PlanCardTitle>
              <SpaceTierLabel tier="pro" />
            </PlanCardTitle>
            <SubscriptionStatusBadge status={status} />
          </div>
          <PlanCardDescription className="flex items-center">
            <Trans
              i18nKey="seatCount"
              defaults="{count, plural, one {# seat} other {# seats}}"
              values={{ count: seats }}
            />
            <Icon>
              <DotIcon />
            </Icon>
            {endsAtPeriodEnd ? (
              <Trans
                i18nKey="subscriptionCardEndsOn"
                defaults="Ends {date}"
                values={{ date }}
              />
            ) : (
              <Trans
                i18nKey="subscriptionCardRenewsOn"
                defaults="Renews {date}"
                values={{ date }}
              />
            )}
          </PlanCardDescription>
        </PlanCardContent>
        <PlanCardPrice>
          <PlanCardPriceValue>{price}</PlanCardPriceValue>
          <PlanCardPriceDescription>
            {interval === "month" ? (
              <Trans i18nKey="subscriptionCardPerMonth" defaults="per month" />
            ) : (
              <Trans i18nKey="subscriptionCardPerYear" defaults="per year" />
            )}
          </PlanCardPriceDescription>
        </PlanCardPrice>
      </PlanCardHeader>
      <PlanCardFooter>
        <div className="flex gap-2">
          <Button
            loading={openCustomerPortal.isExecuting}
            onClick={() => {
              posthog?.capture("space_billing:billing_portal_button_click");
              openCustomerPortal.execute({});
            }}
          >
            <Icon>
              <CreditCardIcon />
            </Icon>
            <Trans
              i18nKey="manageSubscription"
              defaults="Manage Subscription"
            />
          </Button>
          <ManageSeatsDialog usedSeats={usedSeats} currentSeats={seats}>
            <DialogTrigger
              render={
                <Button
                  onClick={() => {
                    posthog?.capture("space_billing:manage_seats_button_click");
                  }}
                />
              }
            >
              <Icon>
                <ArmchairIcon />
              </Icon>
              <Trans i18nKey="manageSeats" defaults="Manage Seats" />
            </DialogTrigger>
          </ManageSeatsDialog>
        </div>
      </PlanCardFooter>
    </PlanCard>
  );
}
