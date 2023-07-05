import { trpc } from "@rallly/backend";
import { CreditCardIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import { Card } from "@rallly/ui/card";
import { Label } from "@rallly/ui/label";
import dayjs from "dayjs";
import Head from "next/head";
import Link from "next/link";
import Script from "next/script";
import { useTranslation } from "next-i18next";

import { BillingPlans } from "@/components/billing/billing-plans";
import { getProfileLayout } from "@/components/layouts/profile-layout";
import { SettingsSection } from "@/components/settings/settings-section";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { usePlan } from "@/contexts/plan";

import { NextPageWithLayout } from "../../types";
import { getStaticTranslations } from "../../utils/with-page-translations";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Paddle: any;
  }
}

export const proPlanIdMonthly = process.env
  .NEXT_PUBLIC_PRO_PLAN_ID_MONTHLY as string;

export const proPlanIdYearly = process.env
  .NEXT_PUBLIC_PRO_PLAN_ID_YEARLY as string;

const SubscriptionStatus = () => {
  const { user } = useUser();

  trpc.user.getBilling.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const plan = usePlan();
  const isPlus = plan === "paid";

  if (user.isGuest) {
    return <>You need to be logged in.</>;
  }

  if (isPlus) {
    return <BillingStatus />;
  } else {
    return <BillingPlans />;
  }
};

const BillingStatus = () => {
  const { data: userPaymentData } = trpc.user.getBilling.useQuery();

  if (!userPaymentData) {
    return <p>Something when wrong. Missing user payment data.</p>;
  }

  const { status, endDate, planId } = userPaymentData;

  if (status === "trialing" || status === "past_due") {
    return <p>Invalid billing status</p>;
  }

  return (
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
  );
};

const Page: NextPageWithLayout = () => {
  const { t } = useTranslation();

  return (
    <div className="divide-y">
      <Head>
        <title>{t("billing")}</title>
      </Head>
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
    </div>
  );
};

Page.getLayout = getProfileLayout;

export const getStaticProps = getStaticTranslations;

export default Page;
