"use client";

import { Button } from "@rallly/ui/button";
import { ArrowUpRightIcon, CreditCardIcon } from "lucide-react";
import { openBillingDetailsAction } from "@/features/billing/actions";
import type { PaymentMethodCard } from "@/features/billing/schema";
import { Trans } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import {
  PlanCard,
  PlanCardContent,
  PlanCardDescription,
  PlanCardFooter,
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

export function PaymentMethodsCard({
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
          <Trans i18nKey="paymentMethods" defaults="Payment method" />
        </PlanCardHeadingTitle>
        <PlanCardHeadingDescription>
          <Trans
            i18nKey="paymentMethodsDescription"
            defaults="The card your subscription is charged to."
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
      </PlanCardHeader>
      <PlanCardFooter className="flex-row items-center justify-end">
        <Button
          loading={openBillingDetails.isExecuting}
          onClick={() => openBillingDetails.execute()}
        >
          <Trans
            i18nKey="managePaymentMethods"
            defaults="Manage payment methods"
          />
          <ArrowUpRightIcon className="text-muted-foreground" />
        </Button>
      </PlanCardFooter>
    </PlanCard>
  );
}
