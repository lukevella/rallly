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
      <PlanCardHeader className="pb-0">
        <PlanCardContent>
          <PlanCardDescription>
            <Trans
              i18nKey="billingDetailsHint"
              defaults="Stored with Stripe and applied to future invoices."
            />
          </PlanCardDescription>
        </PlanCardContent>
      </PlanCardHeader>
      <div className="mt-auto flex flex-wrap items-center gap-2 px-4 pt-3 pb-4">
        <Button
          loading={openBillingDetails.isExecuting}
          onClick={() => openBillingDetails.execute()}
        >
          <Trans i18nKey="editBillingDetails" defaults="Edit billing details" />
          <ArrowUpRightIcon className="text-muted-foreground" />
        </Button>
      </div>
    </PlanCard>
  );
}
