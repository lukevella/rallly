"use client";

import { Button } from "@rallly/ui/button";
import { ArrowUpRightIcon } from "lucide-react";
import { openBillingDetailsAction } from "@/features/billing/actions";
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

export function BillingDetailsCard({ className }: { className?: string }) {
  const openBillingDetails = useSafeAction(openBillingDetailsAction);

  return (
    <PlanCard className={className}>
      <PlanCardHeading>
        <PlanCardHeadingTitle>
          <Trans i18nKey="billingDetails" defaults="Billing details" />
        </PlanCardHeadingTitle>
        <PlanCardHeadingDescription>
          <Trans
            i18nKey="billingDetailsDescription"
            defaults="The name, address and tax ID on your invoices."
          />
        </PlanCardHeadingDescription>
      </PlanCardHeading>
      <PlanCardHeader>
        <PlanCardContent>
          <PlanCardDescription>
            <Trans
              i18nKey="billingDetailsHint"
              defaults="Stored with Stripe and applied to future invoices."
            />
          </PlanCardDescription>
        </PlanCardContent>
      </PlanCardHeader>
      <PlanCardFooter className="flex-row items-center justify-end">
        <Button
          loading={openBillingDetails.isExecuting}
          onClick={() => openBillingDetails.execute()}
        >
          <Trans i18nKey="editBillingDetails" defaults="Edit billing details" />
          <ArrowUpRightIcon className="text-muted-foreground" />
        </Button>
      </PlanCardFooter>
    </PlanCard>
  );
}
