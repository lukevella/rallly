"use client";

import { posthog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import { DialogTrigger } from "@rallly/ui/dialog";
import { Icon } from "@rallly/ui/icon";
import { ArmchairIcon, CreditCardIcon } from "lucide-react";
import { openCustomerPortalAction } from "@/features/billing/actions";
import { Trans } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { ManageSeatsDialog } from "./manage-seats-dialog";

export function SubscriptionActions({
  usedSeats,
  totalSeats,
}: {
  usedSeats: number;
  totalSeats: number;
}) {
  const openCustomerPortal = useSafeAction(openCustomerPortalAction);

  return (
    <div className="flex @sm:flex-row flex-col gap-2">
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
        <Trans i18nKey="manageSubscription" defaults="Manage Subscription" />
      </Button>
      <ManageSeatsDialog usedSeats={usedSeats} currentSeats={totalSeats}>
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
  );
}
