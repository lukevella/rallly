"use client";

import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { CheckCircleIcon } from "lucide-react";
import { BILLING_FLASH_KEY } from "@/features/billing/constants";
import { billingReturnFlowSchema } from "@/features/billing/schema";
import { Trans } from "@/i18n/client";
import { useFlash } from "@/lib/flash/client";

export function BillingFlashAlert() {
  const flow = billingReturnFlowSchema.safeParse(useFlash(BILLING_FLASH_KEY));

  if (!flow.success) {
    return null;
  }

  return (
    <Alert variant="success">
      <CheckCircleIcon />
      {flow.data === "seats" ? (
        <AlertTitle>
          <Trans i18nKey="seatsUpdatedAlertTitle" defaults="Seats updated" />
        </AlertTitle>
      ) : flow.data === "interval" ? (
        <AlertTitle>
          <Trans i18nKey="planChangedAlertTitle" defaults="Plan changed" />
        </AlertTitle>
      ) : flow.data === "cancel" ? (
        <>
          <AlertTitle>
            <Trans
              i18nKey="planCancelScheduledAlertTitle"
              defaults="Cancellation scheduled"
            />
          </AlertTitle>
          <AlertDescription>
            <Trans
              i18nKey="planCancelScheduledAlertDescription"
              defaults="Your plan stays active until the end of the current billing period. You can resume it any time before then."
            />
          </AlertDescription>
        </>
      ) : (
        <>
          <AlertTitle>
            <Trans
              i18nKey="paymentMethodUpdatedAlertTitle"
              defaults="Payment method updated"
            />
          </AlertTitle>
          <AlertDescription>
            <Trans
              i18nKey="paymentMethodUpdatedAlertDescription"
              defaults="Future invoices will be charged to your new payment method."
            />
          </AlertDescription>
        </>
      )}
    </Alert>
  );
}
