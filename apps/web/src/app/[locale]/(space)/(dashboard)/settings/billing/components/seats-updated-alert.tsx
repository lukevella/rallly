"use client";

import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { CheckCircleIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Trans } from "@/components/trans";

export function SeatsUpdatedAlert() {
  const searchParams = useSearchParams();

  if (!searchParams.has("seats_updated")) {
    return null;
  }

  return (
    <Alert variant="tip">
      <CheckCircleIcon />
      <AlertTitle>
        <Trans i18nKey="seatsUpdatedAlertTitle" defaults="Seats Updated" />
      </AlertTitle>
      <AlertDescription>
        <Trans
          i18nKey="seatsUpdatedAlertDescription"
          defaults="Your seat allocation has been successfully updated. The changes will be reflected in your next billing cycle."
        />
      </AlertDescription>
    </Alert>
  );
}
