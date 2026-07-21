import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { CheckCircleIcon, ShieldXIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionDivider,
  PageSectionGroup,
  PageSectionHeader,
  PageSectionTitle,
} from "@/components/page-layout";
import {
  SettingsPage,
  SettingsPageContent,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageTitle,
} from "@/components/settings-layout";
import { getSpaceSubscription } from "@/features/billing/data";
import { getActiveSpace, getSeatUsage } from "@/features/space/loaders";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { requireUser } from "@/features/user/loaders";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { ContactSupportLink } from "./components/contact-support-link";
import { HobbyPlanCard } from "./components/hobby-plan-card";
import { ProPlanCard } from "./components/pro-plan-card";

export default async function BillingSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ seats_updated?: string }>;
}) {
  if (!isFeatureEnabled("billing")) {
    notFound();
  }

  const user = await requireUser();

  const space = await getActiveSpace();

  const ability = defineAbilityForMember({
    user: { id: user.id },
    space: { id: space.id, ownerId: space.ownerId, role: space.role },
  });

  if (!ability.can("manage", "Billing")) {
    return (
      <EmptyState className="h-full">
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

  const [subscription, seatUsage, { seats_updated: didUpdateSeats }] =
    await Promise.all([
      getSpaceSubscription(space.id),
      getSeatUsage(),
      searchParams,
    ]);

  return (
    <SettingsPage>
      <SettingsPageHeader>
        <SettingsPageTitle>
          <Trans i18nKey="billing" defaults="Billing" />
        </SettingsPageTitle>
        <SettingsPageDescription>
          <Trans
            i18nKey="billingDescription"
            defaults="Manage your billing information and subscription."
          />
        </SettingsPageDescription>
      </SettingsPageHeader>
      <SettingsPageContent>
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
              {subscription?.active ? (
                <ProPlanCard
                  amount={subscription.amount}
                  currency={subscription.currency}
                  interval={subscription.interval}
                  seats={subscription.quantity}
                  usedSeats={seatUsage.used}
                  status={subscription.status}
                  cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
                  periodEnd={subscription.periodEnd}
                />
              ) : (
                <HobbyPlanCard />
              )}
              {didUpdateSeats !== undefined ? (
                <Alert variant="success">
                  <CheckCircleIcon />
                  <AlertTitle>
                    <Trans
                      i18nKey="seatsUpdatedAlertTitle"
                      defaults="Seats Updated"
                    />
                  </AlertTitle>
                  <AlertDescription>
                    <Trans
                      i18nKey="seatsUpdatedAlertDescription"
                      defaults="Your seat allocation has been successfully updated. The changes will be reflected in your next billing cycle."
                    />
                  </AlertDescription>
                </Alert>
              ) : null}
            </PageSectionContent>
          </PageSection>
          <PageSectionDivider />
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
              <ContactSupportLink />
            </PageSectionContent>
          </PageSection>
        </PageSectionGroup>
      </SettingsPageContent>
    </SettingsPage>
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
