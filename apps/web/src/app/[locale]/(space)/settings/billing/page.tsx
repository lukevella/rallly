import { ShieldXIcon } from "lucide-react";
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
import { BillingFlashAlert } from "@/features/billing/components/billing-flash-alert";
import { loadSubscriptionOverview } from "@/features/billing/loaders";
import { getActiveSpace, getSeatUsage } from "@/features/space/loaders";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { requireUser } from "@/features/user/loaders";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { ContactSupportLink } from "./components/contact-support-link";
import { HobbyPlanCard } from "./components/hobby-plan-card";
import { ProPlanCard } from "./components/pro-plan-card";

export default async function BillingSettingsPage() {
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
          <Trans i18nKey="accessDenied" defaults="Access denied" />
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

  const [overview, seatUsage] = await Promise.all([
    loadSubscriptionOverview(),
    getSeatUsage(),
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
            <PageSectionContent>
              {overview?.subscription.active ? (
                <ProPlanCard
                  amount={overview.subscription.amount}
                  discountPercentOff={overview.subscription.discountPercentOff}
                  discountAmountOff={overview.subscription.discountAmountOff}
                  currency={overview.subscription.currency}
                  interval={overview.subscription.interval}
                  seats={overview.subscription.quantity}
                  usedSeats={seatUsage.used}
                  status={overview.subscription.status}
                  cancelAtPeriodEnd={overview.subscription.cancelAtPeriodEnd}
                  periodEnd={overview.subscription.periodEnd}
                  earlySupporter={overview.earlySupporter}
                  listPrice={overview.listPrice}
                  switchToYearly={overview.switchToYearly}
                  canResume={overview.canResume}
                />
              ) : (
                <HobbyPlanCard />
              )}
              <BillingFlashAlert />
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
      defaultValue: "Billing settings",
    }),
    description: t("billingSettingsDescription", {
      defaultValue:
        "View and manage your space's subscription and billing information.",
    }),
  };
}
