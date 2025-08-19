import { ShieldXIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BillingPageClient } from "@/app/[locale]/(space)/(dashboard)/settings/billing/page-client";
import { requireSpace, requireUser } from "@/auth/data";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { Trans } from "@/components/trans";
import { getSpaceSubscription } from "@/features/billing/data";
import { loadMembers } from "@/features/space/data";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { getTotalSeatsForSpace } from "@/features/space/utils";
import { getTranslation } from "@/i18n/server";
import { isFeatureEnabled } from "@/lib/feature-flags/server";

export default async function BillingSettingsPage() {
  if (!isFeatureEnabled("billing")) {
    notFound();
  }
  const [space, user] = await Promise.all([requireSpace(), requireUser()]);

  const ability = defineAbilityForMember({ space, user });
  const canManageBilling = ability.can("manage", "Billing");

  if (!canManageBilling) {
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
    <BillingPageClient
      tier={space.tier}
      subscription={subscription ?? undefined}
      totalSeats={totalSeats}
      usedSeats={usedSeats}
    />
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
