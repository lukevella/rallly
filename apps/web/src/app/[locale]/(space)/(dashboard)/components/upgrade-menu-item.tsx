"use client";

import { buttonVariants } from "@rallly/ui";
import { SidebarMenuItem } from "@rallly/ui/sidebar";
import { HoverPrefetchLink } from "@/components/hover-prefetch-link";
import {
  useProMonthlyPrice,
  useTrial,
  useTrialState,
} from "@/features/billing/client";
import { UpgradeButton } from "@/features/billing/components/upgrade-button";
import { getTrialDaysLeft } from "@/features/billing/trial/utils";
import { Trans } from "@/i18n/client";
import { useDateTime } from "@/lib/datetime/client";

function TrialCard({
  title,
  description,
  action,
}: {
  title: React.ReactNode;
  description: React.ReactNode;
  action: React.ReactNode;
}) {
  return (
    <SidebarMenuItem>
      <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
        <div className="space-y-1">
          <p className="font-medium text-sm">{title}</p>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        {action}
      </div>
    </SidebarMenuItem>
  );
}

/**
 * The sidebar's bottom spot, in three states: before a trial it points at
 * the billing page, where the 14 free days start; during the trial it
 * shows the days left; after it, the price. Hidden while a subscription
 * pays for the space, and on instances without billing.
 */
export function UpgradeMenuItem() {
  const trialState = useTrialState();
  const { trialEndsAt } = useTrial();
  const price = useProMonthlyPrice();
  const { formatDateTime } = useDateTime();

  switch (trialState) {
    case "eligible":
      return (
        <TrialCard
          title={
            <Trans i18nKey="trialCardSeeTitle" defaults="See what Pro does." />
          }
          description={
            <Trans
              i18nKey="trialCardSeeDescription"
              defaults="Invites, tracking, scheduling."
            />
          }
          action={
            <HoverPrefetchLink
              href="/settings/billing"
              className={buttonVariants({ variant: "primary", size: "sm" })}
            >
              <Trans
                i18nKey="tryProFreeForFourteenDays"
                defaults="Try Pro free for 14 days"
              />
            </HoverPrefetchLink>
          }
        />
      );
    case "trial":
      if (!trialEndsAt) {
        return null;
      }
      return (
        <TrialCard
          title={
            <Trans
              i18nKey="trialCardDaysLeft"
              defaults="Pro, {count, plural, one {# day} other {# days}} left"
              values={{ count: getTrialDaysLeft(trialEndsAt) }}
            />
          }
          description={
            <Trans
              i18nKey="trialCardFreeUntil"
              defaults="Free until {date}."
              values={{ date: formatDateTime(trialEndsAt, "monthDay") }}
            />
          }
          action={
            <HoverPrefetchLink
              href="/settings/billing"
              className={buttonVariants({ size: "sm" })}
            >
              <Trans
                i18nKey="keepProPrice"
                defaults="Keep Pro, {price} a month"
                values={{ price }}
              />
            </HoverPrefetchLink>
          }
        />
      );
    case "ended":
      return (
        <TrialCard
          title={
            <Trans
              i18nKey="trialCardEndedTitle"
              defaults="Your 14 free days are over."
            />
          }
          description={
            <Trans
              i18nKey="trialCardEndedDescription"
              defaults="Back on the free plan."
            />
          }
          action={
            <UpgradeButton size="sm">
              <Trans
                i18nKey="upgradeToProPrice"
                defaults="Upgrade to Pro, {price} a month"
                values={{ price }}
              />
            </UpgradeButton>
          }
        />
      );
    default:
      return null;
  }
}
