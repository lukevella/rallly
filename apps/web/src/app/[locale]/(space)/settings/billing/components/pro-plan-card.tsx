"use client";

import { posthog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import { DialogTrigger, useDialog } from "@rallly/ui/dialog";
import { toast } from "@rallly/ui/sonner";
import { ArrowUpRightIcon, TriangleAlertIcon } from "lucide-react";
import {
  openBillingDetailsAction,
  openCancelPlanAction,
  openPaymentMethodUpdateAction,
  resumePlanAction,
} from "@/features/billing/actions";
import { EarlySupporterBadge } from "@/features/billing/components/early-supporter-badge";
import { SubscriptionStatusBadge } from "@/features/billing/components/subscription-status-badge";
import type {
  BillingInterval,
  SubscriptionStatus,
} from "@/features/billing/schema";
import { formatMinorUnitAmount } from "@/features/billing/utils";
import { SpaceTierLabel } from "@/features/space/components/space-tier";
import { Trans, useTranslation } from "@/i18n/client";
import { useDateTime, useDateTimeConfig } from "@/lib/datetime/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { ManageSeatsDialog } from "./manage-seats-dialog";
import {
  PlanCard,
  PlanCardActions,
  PlanCardContent,
  PlanCardDescription,
  PlanCardFooter,
  PlanCardHeader,
  PlanCardHeading,
  PlanCardHeadingDescription,
  PlanCardHeadingTitle,
  PlanCardTitle,
} from "./plan-card";
import { SwitchToYearlyDialog } from "./switch-to-yearly-dialog";

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
  const switchToYearlyDialog = useDialog();
  const openCancelPlan = useSafeAction(openCancelPlanAction);
  const openPaymentMethodUpdate = useSafeAction(openPaymentMethodUpdateAction);
  const openBillingDetails = useSafeAction(openBillingDetailsAction);
  const resumePlan = useSafeAction(resumePlanAction, {
    onSuccess: () => {
      toast.success(
        t("planResumedToast", { defaultValue: "Your plan will renew" }),
      );
    },
  });

  const formatCurrency = (minorUnitAmount: number) =>
    formatMinorUnitAmount({ amount: minorUnitAmount, currency, locale });

  // Coupons are applied by Stripe at the invoice level, so the stored
  // discount is applied here to show what the customer is actually charged.
  const subtotal = amount * seats;
  let total = subtotal;
  if (discountPercentOff) {
    total = Math.round(total * (1 - discountPercentOff / 100));
  }
  if (discountAmountOff) {
    total = Math.max(0, total - discountAmountOff);
  }
  const hasDiscount = total !== subtotal;
  const perMonth = interval === "year" ? Math.round(total / 12) : total;

  const date = formatDateTime(periodEnd, "date");
  const endsAtPeriodEnd = status === "canceled" || cancelAtPeriodEnd;
  const needsPayment = status === "past_due" || status === "unpaid";
  const listPriceForInterval =
    listPrice?.[interval === "month" ? "monthly" : "yearly"];

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
                loading={resumePlan.isExecuting}
                onClick={() => resumePlan.execute()}
              >
                <Trans i18nKey="resumePlan" defaults="Resume plan" />
              </Button>
            ) : null
          ) : (
            <>
              {needsPayment ? (
                <Button
                  loading={openPaymentMethodUpdate.isExecuting}
                  onClick={() => openPaymentMethodUpdate.execute()}
                >
                  <TriangleAlertIcon className="text-amber-500" />
                  <Trans
                    i18nKey="updatePaymentMethod"
                    defaults="Update payment method"
                  />
                </Button>
              ) : null}
              {switchToYearly && !needsPayment ? (
                <SwitchToYearlyDialog
                  {...switchToYearlyDialog.dialogProps}
                  monthlyAmount={switchToYearly.monthlyAmount}
                  yearlyAmount={switchToYearly.yearlyAmount}
                >
                  <DialogTrigger
                    render={
                      <Button
                        onClick={() => {
                          posthog?.capture("space_billing:change_plan_click");
                        }}
                      />
                    }
                  >
                    <Trans
                      i18nKey="switchToYearly"
                      defaults="Switch to yearly"
                    />
                  </DialogTrigger>
                </SwitchToYearlyDialog>
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
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            className="text-muted-foreground"
            loading={openBillingDetails.isExecuting}
            onClick={() => openBillingDetails.execute()}
          >
            <Trans i18nKey="invoices" defaults="Invoices" />
            <ArrowUpRightIcon className="text-muted-foreground" />
          </Button>
          {endsAtPeriodEnd ? null : (
            <Button
              variant="ghost"
              className="text-muted-foreground"
              loading={openCancelPlan.isExecuting}
              onClick={() => openCancelPlan.execute()}
            >
              <Trans i18nKey="cancelPlan" defaults="Cancel plan" />
            </Button>
          )}
        </div>
      </PlanCardFooter>
    </PlanCard>
  );
}
