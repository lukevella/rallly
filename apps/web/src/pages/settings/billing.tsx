import { trpc } from "@rallly/backend";
import { CreditCardIcon } from "@rallly/icons";
import { Button } from "@rallly/ui/button";
import { Label } from "@rallly/ui/label";
import dayjs from "dayjs";
import Head from "next/head";
import Link from "next/link";
import Script from "next/script";
import { useTranslation } from "next-i18next";
import React from "react";

import { Card } from "@/components/card";
import { getProfileLayout } from "@/components/layouts/profile-layout";
import { SettingsSection } from "@/components/settings/settings-section";
import Switch from "@/components/switch";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";

import { NextPageWithLayout } from "../../types";
import { getStaticTranslations } from "../../utils/with-page-translations";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Paddle: any;
    createLemonSqueezy: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    LemonSqueezy: any;
  }
}

const monthlyPriceUsd = 5;
const annualPriceUsd = 30;

export const plusPlanIdMonthly = process.env
  .NEXT_PUBLIC_PLUS_PLAN_ID_MONTHLY as string;

export const plusPlanIdYearly = process.env
  .NEXT_PUBLIC_PLUS_PLAN_ID_MONTHLY as string;

const Active = () => {
  return (
    <span className="bg-primary rounded px-1.5 py-0.5 text-xs font-medium text-white">
      <Trans i18nKey="planActive" defaults="Active" />
    </span>
  );
};

const SubscriptionStatus = () => {
  const userPaymentDataQuery = trpc.user.getBilling.useQuery();
  const { user } = useUser();

  const [isBilledAnnually, setBilledAnnually] = React.useState(true);

  if (user.isGuest) {
    return <>You need to be logged in.</>;
  }

  const userPaymentData = userPaymentDataQuery.data;
  const isPlus = Boolean(
    userPaymentData &&
      userPaymentData.subscriptionEndDate.getTime() > Date.now(),
  );

  return (
    <div>
      <Label className="mb-4">Subscription</Label>
      <p className="text-muted-foreground mb-4 text-sm">
        Please consider subscribing to help support the continued development of
        Rallly.
      </p>
      <div className="mb-6 flex items-center gap-4">
        <Switch
          checked={isBilledAnnually}
          onChange={(checked) => {
            setBilledAnnually(checked);
          }}
        />
        <Label>
          <Trans
            i18nKey="annualBilling"
            defaults="Annual billing (Save {discount}%)"
            values={{
              discount: Math.round(100 - (annualPriceUsd / 12 / 5) * 100),
            }}
          />
        </Label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex flex-col divide-y">
          <div className="p-4">
            <div className="mb-4 flex items-center gap-x-4">
              <h2>Free</h2>
              {!isPlus ? <Active /> : null}
            </div>
            <div>
              <span className="text-3xl font-bold">$0</span>
              <div className="text-muted-foreground text-sm">free forever</div>
            </div>
          </div>
          <div className="flex grow flex-col p-4">
            <ul className="text-muted-foreground grow text-sm">
              <li>Unlimited polls</li>
              <li>Unlimited participants</li>
            </ul>
          </div>
        </Card>
        <Card className="border-primary ring-primary divide-y ring-1">
          <div className="bg-pattern p-4">
            <div className="mb-4 flex items-center gap-x-4">
              <h2 className="text-primary">Plus</h2>
              {isPlus ? <Active /> : null}
            </div>

            {isBilledAnnually ? (
              <div>
                <span className="mr-2 text-xl font-bold line-through">
                  ${monthlyPriceUsd}
                </span>
                <span className="text-3xl font-bold">
                  ${(annualPriceUsd / 12).toFixed(2)}
                </span>
                <div className="text-muted-foreground text-sm">
                  per month, billed annually
                </div>
              </div>
            ) : (
              <div>
                <span className="text-3xl font-bold">$5</span>
                <div className="text-muted-foreground text-sm">per month</div>
              </div>
            )}
          </div>
          <div className="p-4">
            <p className="text-muted-foreground mb-6 text-sm">
              By subscribing, you not only gain access to extra features but you
              are also directly supporting further development of Rallly.
            </p>
            <ul className="text-muted-foreground text-sm">
              <li>Unlimited polls</li>
              <li>Unlimited participants</li>
              <li>Finalize polls</li>
              <li>Extended poll life</li>
              <li>Priority support</li>
              <li>Access to new features</li>
            </ul>
            {!isPlus ? (
              <div className="mt-6">
                <Button
                  className="w-full"
                  variant="primary"
                  onClick={() => {
                    window.LemonSqueezy.Url.Open();
                    // window.Paddle.Checkout.open({
                    //   allowQuantity: false,
                    //   product: isBilledAnnually
                    //     ? plusPlanIdYearly
                    //     : plusPlanIdMonthly,
                    //   email: user.email,
                    //   disableLogout: true,
                    //   passthrough: JSON.stringify({ userId: user.id }),
                    //   successCallback: () => {
                    //     // fetch user till we get the new plan
                    //   },
                    // });
                  }}
                >
                  <Trans i18nKey="planUpgrade" defaults="Upgrade" />
                </Button>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
};

const BillingStatus = () => {
  const userPaymentDataQuery = trpc.user.getBilling.useQuery();

  if (!userPaymentDataQuery.isFetched) {
    return null;
  }

  const userPaymentData = userPaymentDataQuery.data;

  const isPlus = Boolean(
    userPaymentData &&
      userPaymentData.subscriptionEndDate.getTime() > Date.now(),
  );

  if (!isPlus) {
    return (
      <div>
        <Label className="mb-4">Inactive</Label>
        <p className="text-muted-foreground text-sm">
          You are currently not subscribed to a paid plan.
        </p>
      </div>
    );
  }

  if (isPlus && userPaymentData?.subscriptionStatus === "active") {
    return (
      <div>
        <div className="mb-4 font-medium">Active</div>
        <p className="text-sm">
          <Trans
            i18nKey="subscriptionActive"
            defaults="Your subscription is <b>active</b> and will automatically renew on <b>{date}</b>."
            components={{ b: <strong /> }}
            values={{
              date: dayjs(userPaymentData.subscriptionEndDate).format("L"),
            }}
          />
        </p>
        <div className="mt-4 flex gap-x-2">
          <Button
            asChild
            onClick={(e) => {
              e.preventDefault();
              window.Paddle.Checkout.open({
                override: userPaymentData.subscriptionUpdateUrl,
              });
            }}
          >
            <Link href={userPaymentData.subscriptionUpdateUrl}>
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
                override: userPaymentData.subscriptionCancelUrl,
              });
            }}
          >
            <Link href={userPaymentData.subscriptionCancelUrl}>
              <Trans i18nKey="subscriptionCancel" defaults="Cancel" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isPlus && userPaymentData?.subscriptionStatus === "deleted") {
    return (
      <div>
        <div className="mb-4 font-medium text-rose-600">Cancelled</div>
        <p className="text-sm">
          <Trans
            i18nKey="subscriptionCancelled"
            defaults="Your current subscription will end on <b>{date}</b>. You won't be charged again."
            values={{
              date: dayjs(userPaymentData.subscriptionEndDate).format("L"),
            }}
            components={{ b: <strong /> }}
          />
        </p>
      </div>
    );
  }

  return <div></div>;
};

const Page: NextPageWithLayout = () => {
  const { t } = useTranslation();

  return (
    <div className="divide-y">
      <Head>
        <title>{t("billing")}</title>
      </Head>
      <Script src="https://app.lemonsqueezy.com/js/lemon.js" defer />
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
        title={<Trans i18nKey="plan" defaults="Plan" />}
        description={
          <Trans i18nKey="planDescription" defaults="Choose your plan" />
        }
      >
        <SubscriptionStatus />
      </SettingsSection>
      <SettingsSection
        title={<Trans i18nKey="billingStatus" defaults="Status" />}
        description={
          <Trans
            i18nKey="billingStatusDescription"
            defaults="Your current billing status"
          />
        }
      >
        <BillingStatus />
      </SettingsSection>
    </div>
  );
};

Page.getLayout = getProfileLayout;

export const getStaticProps = getStaticTranslations;

export default Page;
