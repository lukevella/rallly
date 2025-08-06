import { Button } from "@rallly/ui/button";
import { DialogTrigger } from "@rallly/ui/dialog";
import { Icon } from "@rallly/ui/icon";
import { DotIcon, SendIcon, ShieldXIcon } from "lucide-react";
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
import { PayWallDialog } from "@/components/pay-wall-dialog";
import { StackedList, StackedListItem } from "@/components/stacked-list";
import { Trans } from "@/components/trans";
import { SubscriptionStatus } from "@/features/billing/components/subscription-status";
import { getSpaceSubscription } from "@/features/billing/data";
import {
  SpaceTierIcon,
  SpaceTierLabel,
} from "@/features/space/components/space-tier";
import { getTranslation } from "@/i18n/server";
import { isFeatureEnabled } from "@/lib/feature-flags/server";

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

  const subscription = await getSpaceSubscription(space.id);

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
                  <ul className="flex items-center gap-px text-muted-foreground text-sm">
                    <li>
                      <SubscriptionStatus
                        status={subscription.status}
                        cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
                        periodEnd={subscription.periodEnd}
                      />
                    </li>
                    <li>
                      <Icon>
                        <DotIcon />
                      </Icon>
                    </li>
                    <li>
                      <Trans
                        i18nKey="seatCount"
                        defaults="{count, plural, {one, # seat} {other, # seats}}"
                        values={{ count: subscription?.quantity }}
                      />
                    </li>
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    <Trans i18nKey="priceFree" />
                  </p>
                )}
              </div>
              <div>
                {subscription ? (
                  <Button asChild>
                    <a href="/api/stripe/portal">
                      <Trans i18nKey="manage" />
                    </a>
                  </Button>
                ) : (
                  <PayWallDialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Trans i18nKey="upgradeToPro" />
                      </Button>
                    </DialogTrigger>
                  </PayWallDialog>
                )}
              </div>
            </StackedListItem>
          </StackedList>
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
