"use client";

import { usePostHog } from "@rallly/posthog/client";
import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { Button } from "@rallly/ui/button";
import { DialogTrigger } from "@rallly/ui/dialog";
import { Icon } from "@rallly/ui/icon";
import {
  ArmchairIcon,
  CheckCircleIcon,
  CreditCardIcon,
  SendIcon,
  ShieldXIcon,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionDivider,
  PageSectionGroup,
  PageSectionHeader,
  PageSectionTitle,
} from "@/app/components/page-layout";
import {
  SettingsPage,
  SettingsPageContent,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageTitle,
} from "@/app/components/settings-layout";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { useBilling } from "@/features/billing/client";
import { SubscriptionStatusLabel } from "@/features/billing/components/subscription-status-label";
import { useSpace } from "@/features/space/client";
import type { SpaceTier } from "@/features/space/schema";
import { Trans } from "@/i18n/client";
import { trpc } from "@/trpc/client";
import { BillingPlan } from "./components/billing-plan";
import { ManageSeatsDialog } from "./components/manage-seats-dialog";

export function BillingPageClient() {
  const { data: space, getMemberAbility } = useSpace();
  const ability = getMemberAbility();
  const canManageBilling = ability.can("manage", "Billing");

  if (!canManageBilling) {
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

  return <BillingPageContent tier={space.tier} />;
}

function BillingPageContent({ tier }: { tier: SpaceTier }) {
  const posthog = usePostHog();
  const searchParams = useSearchParams();
  const { showPayWall } = useBilling();

  const [subscription] = trpc.billing.getSubscription.useSuspenseQuery();
  const [seats] = trpc.space.seats.useSuspenseQuery();

  const didUpdateSeats = searchParams.has("seats_updated");

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
              <BillingPlan
                tier={tier}
                status={
                  subscription ? (
                    <SubscriptionStatusLabel
                      status={subscription.status}
                      cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
                      periodEnd={subscription.periodEnd}
                    />
                  ) : (
                    <Trans i18nKey="priceFree" />
                  )
                }
                seats={seats.total}
              />
              <div>
                {subscription ? (
                  <div className="flex justify-between gap-2">
                    <Button
                      onClick={() => {
                        posthog?.capture(
                          "space_billing:billing_portal_button_click",
                        );
                      }}
                      asChild
                    >
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
                    <ManageSeatsDialog
                      usedSeats={seats.used}
                      currentSeats={seats.total}
                    >
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            posthog?.capture(
                              "space_billing:manage_seats_button_click",
                            );
                          }}
                        >
                          <Icon>
                            <ArmchairIcon />
                          </Icon>
                          <Trans
                            i18nKey="manageSeats"
                            defaults="Manage Seats"
                          />
                        </Button>
                      </DialogTrigger>
                    </ManageSeatsDialog>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => {
                      showPayWall();
                      posthog?.capture("space_billing:upgrade_button_click");
                    }}
                  >
                    <Trans i18nKey="upgradeToPro" />
                  </Button>
                )}
              </div>
              {didUpdateSeats ? (
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
              <Button
                onClick={() => {
                  posthog?.capture("space_billing:support_button_click");
                }}
                asChild
              >
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
      </SettingsPageContent>
    </SettingsPage>
  );
}
