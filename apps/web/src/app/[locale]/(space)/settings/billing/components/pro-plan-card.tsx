"use client";

import { mutationOptions } from "@next-safe-action/adapter-tanstack-query";
import { formatMinorUnitAmount } from "@rallly/billing/pricing";
import { posthog } from "@rallly/posthog/client";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { DialogTrigger, useDialog } from "@rallly/ui/dialog";
import { toast } from "@rallly/ui/sonner";
import { useMutation } from "@tanstack/react-query";
import { TriangleAlertIcon } from "lucide-react";
import {
  openPaymentMethodUpdateAction,
  resumePlanAction,
  switchToYearlyAction,
} from "@/features/billing/actions";
import { EarlySupporterBadge } from "@/features/billing/components/early-supporter-badge";
import { SubscriptionStatusBadge } from "@/features/billing/components/subscription-status-badge";
import type {
  BillingInterval,
  SubscriptionStatus,
} from "@/features/billing/schema";
import { SpaceTierLabel } from "@/features/space/components/space-tier";
import { Trans, useTranslation } from "@/i18n/client";
import { useDateTime, useDateTimeConfig } from "@/lib/datetime/client";
import { CancelPlanDialog } from "./cancel-plan-dialog";
import { ManageSeatsDialog } from "./manage-seats-dialog";
import {
  PlanCard,
  PlanCardActions,
  PlanCardContent,
  PlanCardDescription,
  PlanCardFooter,
  PlanCardHeader,
  PlanCardTitle,
} from "./plan-card";

export function ProPlanCard({
  amount,
  discountPercentOff,
  discountAmountOff,
  currency,
  interval,
  seats,
  usedSeats,
  status,
  cancelAtPeriodEnd,
  periodEnd,
  earlySupporter,
  listPrice,
  switchToYearly,
  canResume,
  className,
}: {
  /** Per seat unit amount in the currency's minor unit. */
  amount: number;
  discountPercentOff?: number | null;
  discountAmountOff?: number | null;
  currency: string;
  interval: BillingInterval;
  seats: number;
  usedSeats: number;
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  periodEnd: Date;
  earlySupporter: boolean;
  /** Current list prices per seat in this currency, for the early supporter copy. */
  listPrice: { monthly?: number; yearly?: number } | null;
  /** Set for monthly subscribers who can switch to yearly; null otherwise. */
  switchToYearly: { monthlyAmount: number; yearlyAmount: number } | null;
  canResume: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const { locale } = useDateTimeConfig();
  const { formatDateTime } = useDateTime();
  const cancelPlanDialog = useDialog();
  const openPaymentMethodUpdate = useMutation(
    mutationOptions(openPaymentMethodUpdateAction),
  );
  const switchToYearlyMutation = useMutation(
    mutationOptions(switchToYearlyAction),
  );
  const resumePlan = useMutation(
    mutationOptions(resumePlanAction, {
      onSuccess: () => {
        toast.success(
          t("planResumedToast", { defaultValue: "Your plan will renew" }),
        );
      },
    }),
  );

  const formatCurrency = (minorUnitAmount: number) =>
    formatMinorUnitAmount({ amount: minorUnitAmount, currency, locale });

  // Coupons are applied by Stripe at the invoice level, so the stored
  // discount is applied here to show what the customer is actually charged.
  const applyDiscount = (subtotal: number) => {
    let discounted = subtotal;
    if (discountPercentOff) {
      discounted = Math.round(discounted * (1 - discountPercentOff / 100));
    }
    if (discountAmountOff) {
      discounted = Math.max(0, discounted - discountAmountOff);
    }
    return discounted;
  };
  const subtotal = amount * seats;
  const total = applyDiscount(subtotal);
  const hasDiscount = total !== subtotal;
  const perMonth = interval === "year" ? Math.round(total / 12) : total;

  const date = formatDateTime(periodEnd, "date");
  const endsAtPeriodEnd = status === "canceled" || cancelAtPeriodEnd;
  const needsPayment = status === "past_due" || status === "unpaid";
  const listPriceForInterval =
    listPrice?.[interval === "month" ? "monthly" : "yearly"];

  return (
    <PlanCard className={className}>
      <PlanCardHeader>
        <PlanCardContent>
          <PlanCardTitle>
            <SpaceTierLabel tier="pro" />
            <SubscriptionStatusBadge status={status} />
            {earlySupporter ? (
              <EarlySupporterBadge>
                {endsAtPeriodEnd ? (
                  listPriceForInterval !== undefined ? (
                    <Trans
                      i18nKey="earlySupporterRateEnds"
                      defaults="Your early supporter rate ends with your subscription. New subscriptions are {price} per {interval, select, month {month} other {year}}."
                      values={{
                        price: formatCurrency(listPriceForInterval),
                        interval,
                      }}
                    />
                  ) : (
                    <Trans
                      i18nKey="earlySupporterRateEndsNoPrice"
                      defaults="Your early supporter rate ends with your subscription."
                    />
                  )
                ) : (
                  <Trans
                    i18nKey="earlySupporterRateKept"
                    defaults="You keep this rate for as long as your subscription stays active."
                  />
                )}
              </EarlySupporterBadge>
            ) : null}
          </PlanCardTitle>
          <PlanCardDescription>
            <span className="font-medium text-foreground">
              {formatCurrency(perMonth)}
            </span>{" "}
            {interval === "month" ? (
              <Trans
                i18nKey="planPriceBilledMonthly"
                defaults="per month · billed monthly"
              />
            ) : (
              <Trans
                i18nKey="planPriceBilledYearly"
                defaults="per month · billed yearly"
              />
            )}
            {hasDiscount ? (
              <>
                {" · "}
                {discountPercentOff ? (
                  <Trans
                    i18nKey="subscriptionCardPercentDiscount"
                    defaults="{percent}% discount applied"
                    values={{ percent: discountPercentOff }}
                  />
                ) : (
                  <Trans
                    i18nKey="subscriptionCardAmountDiscount"
                    defaults="{amount} discount applied"
                    values={{ amount: formatCurrency(discountAmountOff ?? 0) }}
                  />
                )}
              </>
            ) : null}
          </PlanCardDescription>
        </PlanCardContent>
        <PlanCardActions>
          {endsAtPeriodEnd ? (
            canResume ? (
              <Button
                loading={resumePlan.isPending}
                onClick={() => resumePlan.mutate()}
              >
                <Trans i18nKey="resumePlan" defaults="Resume plan" />
              </Button>
            ) : null
          ) : (
            <>
              {needsPayment ? (
                <Button
                  loading={openPaymentMethodUpdate.isPending}
                  onClick={() => openPaymentMethodUpdate.mutate()}
                >
                  <TriangleAlertIcon className="text-amber-500" />
                  <Trans
                    i18nKey="updatePaymentMethod"
                    defaults="Update payment method"
                  />
                </Button>
              ) : null}
              {switchToYearly && !needsPayment ? (
                <Button
                  loading={switchToYearlyMutation.isPending}
                  onClick={() => {
                    posthog?.capture("space_billing:change_plan_click");
                    switchToYearlyMutation.mutate();
                  }}
                >
                  <Trans i18nKey="switchToYearly" defaults="Switch to yearly" />
                  <Badge variant="green">
                    <Trans
                      i18nKey="switchToYearlySave"
                      defaults="Save {amount}"
                      values={{
                        amount: formatCurrency(
                          applyDiscount(switchToYearly.monthlyAmount * seats) *
                            12 -
                            applyDiscount(switchToYearly.yearlyAmount * seats),
                        ),
                      }}
                    />
                  </Badge>
                </Button>
              ) : null}
              <ManageSeatsDialog usedSeats={usedSeats} currentSeats={seats}>
                <DialogTrigger
                  render={
                    <Button
                      onClick={() => {
                        posthog?.capture(
                          "space_billing:manage_seats_button_click",
                        );
                      }}
                    />
                  }
                >
                  <Trans i18nKey="manageSeats" defaults="Manage seats" />
                </DialogTrigger>
              </ManageSeatsDialog>
            </>
          )}
        </PlanCardActions>
      </PlanCardHeader>
      <PlanCardFooter>
        <span>
          {endsAtPeriodEnd ? (
            <Trans
              i18nKey="planEndsOn"
              defaults="Ends on {date}"
              values={{ date }}
            />
          ) : (
            <Trans
              i18nKey="planRenewsOn"
              defaults="Renews on {date}"
              values={{ date }}
            />
          )}
          {" · "}
          <Trans
            i18nKey="seatCount"
            defaults="{count, plural, one {# seat} other {# seats}}"
            values={{ count: seats }}
          />
        </span>
        {endsAtPeriodEnd ? null : (
          <CancelPlanDialog {...cancelPlanDialog.dialogProps} periodEnd={date}>
            <DialogTrigger
              render={
                <Button
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => {
                    posthog?.capture("space_billing:cancel_plan_click", {
                      interval,
                    });
                  }}
                />
              }
            >
              <Trans i18nKey="cancelPlan" defaults="Cancel plan" />
            </DialogTrigger>
          </CancelPlanDialog>
        )}
      </PlanCardFooter>
    </PlanCard>
  );
}
