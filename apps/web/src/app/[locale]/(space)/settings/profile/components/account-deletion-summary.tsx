import { Alert, AlertDescription } from "@rallly/ui/alert";
import { Icon } from "@rallly/ui/icon";
import { Skeleton } from "@rallly/ui/skeleton";
import { BarChart2Icon, CalendarIcon, InfoIcon } from "lucide-react";
import { getAccountDeletionSummary } from "@/features/user/account-deletion/data";
import { requireUser } from "@/features/user/loaders";
import { Trans } from "@/i18n/client";

// Streamed into the delete account dialog behind Suspense so opening the
// settings page never waits on the counts.
export async function AccountDeletionSummary() {
  const user = await requireUser();
  const { activePollCount, upcomingEventCount, hasActiveSubscription } =
    await getAccountDeletionSummary({
      userId: user.id,
      timeZone: user.timeZone ?? "UTC",
    });

  const hasResources = activePollCount > 0 || upcomingEventCount > 0;

  if (!hasResources && !hasActiveSubscription) {
    return null;
  }

  return (
    <>
      {hasResources ? (
        <ul className="space-y-2">
          {activePollCount > 0 ? (
            <li className="flex items-center gap-x-2">
              <Icon>
                <BarChart2Icon />
              </Icon>
              <Trans
                i18nKey="deleteAccountActivePolls"
                defaults="{count, plural, one {# active poll} other {# active polls}}"
                values={{ count: activePollCount }}
              />
            </li>
          ) : null}
          {upcomingEventCount > 0 ? (
            <li className="flex items-center gap-x-2">
              <Icon>
                <CalendarIcon />
              </Icon>
              <Trans
                i18nKey="deleteAccountUpcomingEvents"
                defaults="{count, plural, one {# upcoming event} other {# upcoming events}}"
                values={{ count: upcomingEventCount }}
              />
            </li>
          ) : null}
        </ul>
      ) : null}
      {hasActiveSubscription ? (
        <Alert>
          <InfoIcon />
          <AlertDescription>
            <p>
              <Trans
                i18nKey="deleteAccountSubscriptionNotice"
                defaults="Your Pro subscription will not renew and will end with your current billing period. If you cancel the deletion, your subscription will continue as normal."
              />
            </p>
          </AlertDescription>
        </Alert>
      ) : null}
    </>
  );
}

export function AccountDeletionSummarySkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-5 w-48" />
    </div>
  );
}
