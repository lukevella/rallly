import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { CreditCardIcon, SendIcon, ShieldXIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionGroup,
  PageSectionHeader,
  PageSectionTitle,
} from "@/app/components/page-layout";
import { requireSpace, requireUser } from "@/auth/data";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { StackedList, StackedListItem } from "@/components/stacked-list";
import { Trans } from "@/components/trans";
import { PayWallButton } from "@/features/billing/client";
import { SubscriptionStatus } from "@/features/billing/components/subscription-status";
import { getSpaceSubscription } from "@/features/billing/data";
import {
  SpaceTierIcon,
  SpaceTierLabel,
} from "@/features/space/components/space-tier";
import { loadMembers } from "@/features/space/data";
import { getTotalSeatsForSpace } from "@/features/space/utils";
import { getTranslation } from "@/i18n/server";
import { isFeatureEnabled } from "@/lib/feature-flags/server";

import { ManageSeatsButton } from "./components/manage-seats-button";

export default async function BillingSettingsPage() {
  if (!isFeatureEnabled("billing")) {
    notFound();
  }
  const [space, user] = await Promise.all([requireSpace(), requireUser()]);

  // Check if user is owner - only owners can access billing
  const isOwner = space.ownerId === user.id;

  if (!isOwner) {
    return (
      <EmptyState>
        <EmptyStateIcon>
          <ShieldXIcon />
        </EmptyStateIcon>
        <EmptyStateTitle>
          <Trans i18nKey="accessDenied" defaults="Access Denied" />
        </EmptyStateTitle>
        <EmptyStateDescription>
          <Trans
            i18nKey="ownerPermissionsRequired"
            defaults="Only space owners can access billing settings."
          />
        </EmptyStateDescription>
      </EmptyState>
    );
  }

  const [subscription, members, totalSeats] = await Promise.all([
    getSpaceSubscription(space.id),
    loadMembers(),
    getTotalSeatsForSpace(space.id),
  ]);

  const usedSeats = members.total;

  return (
    <PageSectionGroup>
      <PageSection>
        <PageSectionHeader>
          <PageSectionTitle>
            <Trans i18nKey="billingPlanTitle" defaults="Plan" />
          </PageSectionTitle>
          <PageSectionDescription>
            <Trans
              i18nKey="billingSubscriptionDescription"
              defaults="Manage your current subscription plan"
            />
          </PageSectionDescription>
        </PageSectionHeader>
        <PageSectionContent>
          <StackedList>
            <StackedListItem>
              <SpaceTierIcon tier={space.tier} />
              <div className="flex-1">
                <div className="font-semibold text-sm">
                  <SpaceTierLabel tier={space.tier} />
                </div>
                {subscription ? (
                  <p className="text-muted-foreground text-sm">
                    <SubscriptionStatus
                      status={subscription.status}
                      cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
                      periodEnd={subscription.periodEnd}
                    />
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    <Trans i18nKey="priceFree" />
                  </p>
                )}
              </div>
              <div className="text-muted-foreground text-sm">
                <Trans
                  i18nKey="seatCount"
                  defaults="{count, plural, {one, # seat} {other, # seats}}"
                  values={{ count: subscription?.quantity }}
                />
              </div>
            </StackedListItem>
          </StackedList>

          <div>
            {subscription ? (
              <div className="flex justify-between gap-2">
                <Button asChild>
                  <a href="/api/stripe/portal">
                    <Icon>
                      <CreditCardIcon />
                    </Icon>
                    <Trans
                      i18nKey="manageSubscription"
                      defaults="Manage Subscription"
                    />
                  </a>
                </Button>
                <ManageSeatsButton
                  currentSeats={totalSeats}
                  usedSeats={usedSeats}
                />
              </div>
            ) : (
              <PayWallButton>
                <Trans i18nKey="upgradeToPro" />
              </PayWallButton>
            )}
          </div>
        </PageSectionContent>
      </PageSection>
      <PageSection>
        <PageSectionHeader>
          <PageSectionTitle>
            <Trans i18nKey="support" defaults="Support" />
          </PageSectionTitle>
          <PageSectionDescription>
            <Trans
              i18nKey="supportDescription"
              defaults="Need help with anything?"
            />
          </PageSectionDescription>
        </PageSectionHeader>
        <PageSectionContent>
          <Button asChild>
            <a href="mailto:support@rallly.co">
              <Icon>
                <SendIcon />
              </Icon>
              <Trans i18nKey="contactSupport" defaults="Contact Support" />
            </a>
          </Button>
        </PageSectionContent>
      </PageSection>
    </PageSectionGroup>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("billingSettings", {
      defaultValue: "Billing Settings",
    }),
    description: t("billingSettingsDescription", {
      defaultValue:
        "View and manage your space's subscription and billing information.",
    }),
  };
}
