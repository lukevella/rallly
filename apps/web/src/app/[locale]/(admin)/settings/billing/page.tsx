import { prisma } from "@rallly/database";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { DialogTrigger } from "@rallly/ui/dialog";
import { Icon } from "@rallly/ui/icon";
import {
  ArrowUpRightIcon,
  CircleAlertIcon,
  CreditCardIcon,
  GemIcon,
  PlusIcon,
  SendIcon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "@/components/description-list";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { FormattedDate } from "@/components/formatted-date";
import { PayWallDialog } from "@/components/pay-wall-dialog";
import {
  SettingsContent,
  SettingsSection,
} from "@/app/[locale]/(admin)/settings/components/settings-layout";
import { Trans } from "@/components/trans";
import { requireUser } from "@/next-auth";
import { isSelfHosted } from "@/utils/constants";

import { PaymentMethod } from "./components/payment-method";
import { SubscriptionPrice } from "./components/subscription-price";
import { SubscriptionStatus } from "./components/subscription-status";

async function getData() {
  const { userId } = await requireUser();

  const data = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      customerId: true,
      subscription: {
        select: {
          id: true,
          active: true,
          currency: true,
          amount: true,
          priceId: true,
          periodStart: true,
          periodEnd: true,
          interval: true,
          cancelAtPeriodEnd: true,
          status: true,
        },
      },
      paymentMethods: {
        select: {
          id: true,
          type: true,
          data: true,
        },
      },
    },
  });

  if (!data) {
    redirect("/api/auth/invalid-session");
  }

  return data;
}

export default async function Page() {
  if (isSelfHosted) {
    notFound();
  }

  const data = await getData();

  const { subscription } = data;

  return (
    <SettingsContent>
      <SettingsSection
        title={
          <Trans i18nKey="billingSubscriptionTitle" defaults="Subscription" />
        }
        description={
          <Trans
            i18nKey="billingSubscriptionDescription"
            defaults="View and manage your current subscription plan"
          />
        }
      >
        {subscription ? (
          <div className="space-y-4">
            <DescriptionList>
              <DescriptionTerm>
                <Trans i18nKey="billingSubscriptionPlan" defaults="Plan" />
              </DescriptionTerm>
              <DescriptionDetails>
                {subscription ? (
                  <div className="flex items-center gap-x-2">
                    <span className="font-bold">Pro</span>
                    <Badge
                      variant={
                        subscription.status === "active" ? "green" : "default"
                      }
                    >
                      <SubscriptionStatus
                        status={subscription.status}
                        cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
                        periodEnd={subscription.periodEnd}
                      />
                    </Badge>
                  </div>
                ) : (
                  "Hobby"
                )}
              </DescriptionDetails>

              <DescriptionTerm>
                <Trans i18nKey="billingSubscriptionPrice" defaults="Price" />
              </DescriptionTerm>
              <DescriptionDetails>
                {subscription ? (
                  <SubscriptionPrice
                    amount={subscription.amount}
                    currency={subscription.currency}
                    interval={subscription.interval}
                  />
                ) : (
                  <Trans i18nKey="priceFree" defaults="Free" />
                )}
              </DescriptionDetails>

              <DescriptionTerm>
                <Trans
                  i18nKey="billingSubscriptionNextPaymentDue"
                  defaults="Next Payment Due"
                />
              </DescriptionTerm>
              <DescriptionDetails>
                {subscription.cancelAtPeriodEnd ? (
                  "-"
                ) : (
                  <FormattedDate date={subscription.periodEnd} format="short" />
                )}
              </DescriptionDetails>

              <DescriptionTerm>
                <Trans
                  i18nKey="billingPaymentMethod"
                  defaults="Payment Method"
                />
              </DescriptionTerm>
              <DescriptionDetails>
                {data.paymentMethods.length === 0 ? (
                  <div>
                    <div className="space-y-2">
                      <div className="text-destructive flex items-center gap-x-2">
                        <CircleAlertIcon className="size-4" />
                        <span className="font-medium">
                          <Trans
                            i18nKey="noPaymentMethodSet"
                            defaults="No Payment Method Set"
                          />
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        <Trans
                          i18nKey="addPaymentMethodDescription"
                          defaults="Please add a payment method to ensure uninterrupted service for your subscription."
                        />
                      </p>
                    </div>
                    <div className="mt-6">
                      <Button variant="default" asChild>
                        <Link
                          prefetch={false}
                          href="/api/stripe/portal/payment-methods"
                        >
                          <Icon>
                            <PlusIcon />
                          </Icon>
                          <Trans
                            i18nKey="addPaymentMethod"
                            defaults="Add Payment Method"
                          />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {data.paymentMethods.map((method) => (
                      <li key={method.id}>
                        <PaymentMethod type={method.type} data={method.data} />
                      </li>
                    ))}
                  </ul>
                )}
              </DescriptionDetails>
            </DescriptionList>
            {data.customerId ? (
              <div className="flex flex-col items-start justify-between gap-6 gap-x-4 rounded-lg border bg-gray-50 p-4 sm:flex-row">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium">
                    <Trans
                      i18nKey="needToMakeChanges"
                      defaults="Need to make changes?"
                    />
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    <Trans
                      i18nKey="billingPortalDescription"
                      defaults="Visit the billing portal to manage your subscription, update payment methods, or view billing history."
                    />
                  </p>
                </div>
                <Button asChild variant="default">
                  <Link
                    href="/api/stripe/portal"
                    prefetch={false}
                    className="whitespace-nowrap"
                  >
                    <Icon>
                      <CreditCardIcon />
                    </Icon>
                    <Trans i18nKey="billingPortal" defaults="Billing Portal" />
                    <Icon>
                      <ArrowUpRightIcon />
                    </Icon>
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <EmptyState className="py-8">
            <EmptyStateIcon>
              <GemIcon />
            </EmptyStateIcon>
            <EmptyStateTitle>
              <Trans
                i18nKey="billingSubscriptionNotActive"
                defaults="You are not currently subscribed to a plan."
              />
            </EmptyStateTitle>
            <EmptyStateDescription>
              <Trans
                i18nKey="billingSubscriptionUpgradeToProDescription"
                defaults="Upgrade to Pro to get access to all features and benefits."
              />
            </EmptyStateDescription>
            <EmptyStateFooter>
              <PayWallDialog>
                <DialogTrigger asChild>
                  <Button>
                    <Icon>
                      <SparklesIcon />
                    </Icon>
                    <Trans
                      i18nKey="billingSubscriptionUpgradeToPro"
                      defaults="Upgrade to Pro"
                    />
                  </Button>
                </DialogTrigger>
              </PayWallDialog>
            </EmptyStateFooter>
          </EmptyState>
        )}
      </SettingsSection>
      <hr />
      <SettingsSection
        title={<Trans i18nKey="support" defaults="Support" />}
        description={
          <Trans
            i18nKey="supportDescription"
            defaults="Need help with anything?"
          />
        }
      >
        <div className="space-y-6">
          <p className="text-sm">
            <Trans
              i18nKey="supportBilling"
              defaults="Please reach out if you need any assistance."
            />
          </p>
          <Button asChild>
            <Link href="mailto:support@rallly.co">
              <SendIcon className="size-4" />
              <Trans i18nKey="contactSupport" defaults="Contact Support" />
            </Link>
          </Button>
        </div>
      </SettingsSection>
    </SettingsContent>
  );
}
