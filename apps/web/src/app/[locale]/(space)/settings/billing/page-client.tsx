"use client";

import type { SubscriptionStatus } from "@rallly/database";
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
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Trans } from "react-i18next";
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionDivider,
  PageSectionGroup,
  PageSectionHeader,
  PageSectionTitle,
} from "@/app/components/page-layout";
import { useBilling } from "@/features/billing/client";
import { SubscriptionStatusLabel } from "@/features/billing/components/subscription-status-label";
import type { SpaceTier } from "@/features/space/schema";
import { BillingPlan } from "./components/billing-plan";
import { ManageSeatsDialog } from "./components/manage-seats-dialog";

export function BillingPageClient({
  tier,
  subscription,
  totalSeats,
  usedSeats,
}: {
  tier: SpaceTier;
  subscription?: {
    id: string;
    status: SubscriptionStatus;
    cancelAtPeriodEnd: boolean;
    periodEnd: Date;
  };
  totalSeats: number;
  usedSeats: number;
}) {
  const posthog = usePostHog();

  const searchParams = useSearchParams();
  const { showPayWall } = useBilling();

  const didUpdateSeats = searchParams.has("seats_updated");

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
            seats={totalSeats}
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
                  usedSeats={usedSeats}
                  currentSeats={totalSeats}
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
                      <Trans i18nKey="manageSeats" defaults="Manage Seats" />
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
            <Alert variant="tip">
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
  );
}
