"use client";

import { Button } from "@rallly/ui/button";
import { ArrowUpRightIcon, CreditCardIcon } from "lucide-react";
import { openBillingDetailsAction } from "@/features/billing/actions";
import type { PaymentMethodCard } from "@/features/billing/schema";
import { Trans } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import {
  PlanCard,
  PlanCardActions,
  PlanCardContent,
  PlanCardDescription,
  PlanCardHeader,
  PlanCardHeading,
  PlanCardHeadingDescription,
  PlanCardHeadingTitle,
} from "./plan-card";

// Stripe's brand ids are lowercase and unpunctuated; only the display form
// differs, so a lookup beats trying to prettify them generically.
const brandNames: Record<string, string> = {
  amex: "American Express",
  diners: "Diners Club",
  discover: "Discover",
  eftpos_au: "Eftpos",
  jcb: "JCB",
  mastercard: "Mastercard",
  unionpay: "UnionPay",
  visa: "Visa",
};

export function PaymentAndBillingCard({
  paymentMethods,
  className,
}: {
  paymentMethods: {
    id: string;
    type: string;
    card: PaymentMethodCard | null;
  }[];
  className?: string;
}) {
  const openBillingDetails = useSafeAction(openBillingDetailsAction);
  const [primary] = paymentMethods;

  return (
    <PlanCard className={className}>
      <PlanCardHeading>
        <PlanCardHeadingTitle>
          <Trans i18nKey="paymentAndBilling" defaults="Payment and billing" />
        </PlanCardHeadingTitle>
        <PlanCardHeadingDescription>
          <Trans
            i18nKey="paymentAndBillingDescription"
            defaults="How you pay and what appears on your invoices."
          />
        </PlanCardHeadingDescription>
      </PlanCardHeading>
      <PlanCardHeader>
        <PlanCardContent>
          {primary?.card ? (
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-md border border-card-border bg-card">
                <CreditCardIcon className="size-4 text-muted-foreground" />
              </span>
              <div className="min-w-0">
                <p className="text-sm">
                  {brandNames[primary.card.brand] ?? primary.card.brand} ••••{" "}
                  {primary.card.last4}
                </p>
                <PlanCardDescription>
                  <Trans
                    i18nKey="paymentMethodExpires"
                    defaults="Expires {month}/{year}"
                    values={{
                      month: String(primary.card.exp_month).padStart(2, "0"),
                      year: String(primary.card.exp_year),
                    }}
                  />
                  {paymentMethods.length > 1 ? (
                    <>
                      {" · "}
                      <Trans
                        i18nKey="paymentMethodOthers"
                        defaults="{count, plural, one {# other saved} other {# others saved}}"
                        values={{ count: paymentMethods.length - 1 }}
                      />
                    </>
                  ) : null}
                </PlanCardDescription>
              </div>
            </div>
          ) : (
            <PlanCardDescription>
              <Trans
                i18nKey="paymentMethodNone"
                defaults="No saved payment method."
              />
            </PlanCardDescription>
          )}
        </PlanCardContent>
        <PlanCardActions>
          <Button
            loading={openBillingDetails.isExecuting}
            onClick={() => openBillingDetails.execute()}
          >
            <Trans i18nKey="manageBilling" defaults="Manage billing" />
            <ArrowUpRightIcon className="text-muted-foreground" />
          </Button>
        </PlanCardActions>
      </PlanCardHeader>
    </PlanCard>
  );
}
