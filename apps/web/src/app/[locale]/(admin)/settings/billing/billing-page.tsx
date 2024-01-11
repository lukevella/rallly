"use client";
import { Button } from "@rallly/ui/button";
import { Card } from "@rallly/ui/card";
import { Label } from "@rallly/ui/label";
import dayjs from "dayjs";
import { ArrowUpRight, CreditCardIcon, SendIcon } from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import Script from "next/script";
import { useTranslation } from "next-i18next";

import { BillingPlans } from "@/components/billing/billing-plans";
import {
  Settings,
  SettingsContent,
  SettingsSection,
} from "@/components/settings/settings";
import { Trans } from "@/components/trans";
import { useSubscription } from "@/contexts/plan";
import { trpc } from "@/utils/trpc/client";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Paddle: any;
  }
}

const BillingPortal = () => {
  return (
    <div>
      <p className="text-sm">
        <Trans
          i18nKey="activeSubscription"
          defaults="Thank you for subscribing to Rallly Pro. You can manage your subscription and billing details from the billing portal."
        />
      </p>
      <div className="mt-6">
        <Button asChild>
          <Link
            target="_blank"
            href={`/api/stripe/portal?return_path=${encodeURIComponent(
              window.location.pathname,
            )}`}
          >
            <CreditCardIcon className="h-4 w-4" />
            <span>
              <Trans i18nKey="billingPortal" defaults="Billing Portal" />
            </span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
};

const proPlanIdMonthly = process.env.NEXT_PUBLIC_PRO_PLAN_ID_MONTHLY as string;

const SubscriptionStatus = () => {
  const data = useSubscription();

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {!data.active ? (
        <div>
          <Label className="mb-4">
            <Trans i18nKey="upgrade" />
          </Label>
          <BillingPlans />
        </div>
      ) : data.legacy ? (
        <LegacyBilling />
      ) : (
        <BillingPortal />
      )}
    </div>
  );
};

const LegacyBilling = () => {
  const { data: userPaymentData } = trpc.user.getBilling.useQuery();

  if (!userPaymentData) {
    return null;
  }

  const { status, endDate, planId } = userPaymentData;

  if (status === "trialing" || status === "past_due") {
    return <p>Invalid billing status</p>;
  }

  return (
    <>
      {process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID ? (
        <Script
          src="https://cdn.paddle.com/paddle/paddle.js"
          onLoad={() => {
            if (process.env.NEXT_PUBLIC_PADDLE_SANDBOX === "true") {
              window.Paddle.Environment.set("sandbox");
            }
            window.Paddle.Setup({
              vendor: Number(process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID),
            });
          }}
        />
      ) : null}
      <Card>
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <div>
            <Label>
              <Trans i18nKey="billingStatusState" defaults="Status" />
            </Label>
            <div>
              {(() => {
                switch (status) {
                  case "active":
                    return (
                      <Trans i18nKey="billingStatusActive" defaults="Active" />
                    );
                  case "paused":
                    return (
                      <Trans i18nKey="billingStatusPaused" defaults="Paused" />
                    );
                  case "deleted":
                    return (
                      <Trans
                        i18nKey="billingStatusDeleted"
                        defaults="Cancelled"
                      />
                    );
                }
              })()}
            </div>
          </div>
          <div>
            {status === "deleted" ? (
              <Label>
                <Trans i18nKey="endDate" defaults="End date" />
              </Label>
            ) : (
              <Label>
                <Trans i18nKey="dueDate" defaults="Due date" />
              </Label>
            )}
            <div>{dayjs(endDate).format("LL")}</div>
          </div>
          <div>
            <Label>
              <Trans i18nKey="billingStatusPlan" defaults="Plan" />
            </Label>
            <div>
              <Trans i18nKey="planPro" />
            </div>
          </div>
          <div>
            <Label>
              <Trans i18nKey="billingPeriod" defaults="Period" />
            </Label>
            <div>
              {planId === proPlanIdMonthly ? (
                <Trans i18nKey="billingPeriodMonthly" defaults="Monthly" />
              ) : (
                <Trans i18nKey="billingPeriodYearly" defaults="Yearly" />
              )}
            </div>
          </div>
        </div>
        {status === "active" || status === "paused" ? (
          <div className="flex items-center gap-x-2 border-t bg-gray-50 p-3">
            <Button
              asChild
              onClick={(e) => {
                e.preventDefault();
                window.Paddle.Checkout.open({
                  override: userPaymentData.updateUrl,
                });
              }}
            >
              <Link href={userPaymentData.updateUrl}>
                <CreditCardIcon className="h-4 w-4" />
                <Trans
                  i18nKey="subscriptionUpdatePayment"
                  defaults="Update Payment Details"
                />
              </Link>
            </Button>
            <Button
              asChild
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                window.Paddle.Checkout.open({
                  override: userPaymentData.cancelUrl,
                });
              }}
            >
              <Link href={userPaymentData.cancelUrl}>
                <Trans i18nKey="subscriptionCancel" defaults="Cancel" />
              </Link>
            </Button>
          </div>
        ) : null}
      </Card>
    </>
  );
};

<SettingsSection
  title={<Trans i18nKey="support" defaults="Support" />}
  description={
    <Trans i18nKey="supportDescription" defaults="Need help with anything?" />
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
        <SendIcon className="h-4 w-4" />
        <Trans i18nKey="contactSupport" defaults="Contact Support" />
      </Link>
    </Button>
  </div>
</SettingsSection>;

export function BillingPage() {
  const { t } = useTranslation();

  return (
    <Settings>
      <Head>
        <title>{t("billing")}</title>
      </Head>
      <SettingsContent>
        <SettingsSection
          title={<Trans i18nKey="billingStatus" defaults="Billing Status" />}
          description={
            <Trans
              i18nKey="billingStatusDescription"
              defaults="Manage your subscription and billing details."
            />
          }
        >
          <SubscriptionStatus />
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
                <SendIcon className="h-4 w-4" />
                <Trans i18nKey="contactSupport" defaults="Contact Support" />
              </Link>
            </Button>
          </div>
        </SettingsSection>
      </SettingsContent>
    </Settings>
  );
}
