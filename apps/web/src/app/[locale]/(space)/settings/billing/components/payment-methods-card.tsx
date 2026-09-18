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
  PlanCardTitle,
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
            <>
              <PlanCardTitle className="text-base">
                <CreditCardIcon className="size-4 text-muted-foreground" />
                {brandNames[primary.card.brand] ?? primary.card.brand}
                <span className="font-normal text-muted-foreground">
                  •••• {primary.card.last4}
                </span>
              </PlanCardTitle>
              <PlanCardDescription>
                <Trans
                  i18nKey="paymentMethodExpires"
                  defaults="Expires {month}/{year}"
                  values={{
                    month: String(primary.card.exp_month).padStart(2, "0"),
                    year: String(primary.card.exp_year).slice(-2),
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
            </>
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
            <Trans
              i18nKey="managePaymentMethods"
              defaults="Manage payment methods"
            />
            <ArrowUpRightIcon className="text-muted-foreground" />
          </Button>
        </PlanCardActions>
      </PlanCardHeader>
    </PlanCard>
  );
}
