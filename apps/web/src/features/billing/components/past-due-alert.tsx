import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { CreditCardIcon } from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";
import { Link } from "@/components/link";
import { loadIsSubscriptionPastDue } from "@/features/billing/loaders";
import { getTranslation } from "@/i18n/server";

export async function PastDueAlert() {
  const isPastDue = await loadIsSubscriptionPastDue();

  if (!isPastDue) {
    return null;
  }

  const { t, i18n } = await getTranslation();

  return (
    <Alert variant="warning" className="m-1">
      <CreditCardIcon />
      <AlertTitle>
        <Trans
          t={t}
          i18n={i18n}
          ns="app"
          i18nKey="pastDueAlertTitle"
          defaults="Payment failed"
        />
      </AlertTitle>
      <AlertDescription>
        <Trans
          t={t}
          i18n={i18n}
          ns="app"
          i18nKey="pastDueAlertDescription"
          defaults="We couldn't charge your card. Your space stays on Pro while we retry, but will drop to Hobby if the payment isn't updated. <a>Go to billing</a>"
          components={{
            a: <Link href="/settings/billing" />,
          }}
        />
      </AlertDescription>
    </Alert>
  );
}
