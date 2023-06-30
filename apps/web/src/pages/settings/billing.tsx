import { trpc } from "@rallly/backend";
import { Button } from "@rallly/ui/button";
import { Label } from "@rallly/ui/label";
import Head from "next/head";
import Script from "next/script";
import { useTranslation } from "next-i18next";
import React from "react";

import { Card } from "@/components/card";
import { getProfileLayout } from "@/components/layouts/profile-layout";
import { SettingsSection } from "@/components/settings/settings-section";
import { Skeleton } from "@/components/skeleton";
import Switch from "@/components/switch";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";

import { NextPageWithLayout } from "../../types";
import { getStaticTranslations } from "../../utils/with-page-translations";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Paddle: any;
  }
}

const SubscriptionStatus = () => {
  const userPaymentDataQuery = trpc.user.getBilling.useQuery();
  const { user } = useUser();

  const [isBilledAnnually, setBilledAnnually] = React.useState(true);

  if (user.isGuest) {
    return <>You need to be logged in.</>;
  }

  if (!userPaymentDataQuery.isFetched) {
    return <Skeleton className="h-5 w-32" />;
  }

  const userPaymentData = userPaymentDataQuery.data;

  if (!userPaymentData) {
    return (
      <div>
        <Label className="mb-4">Subscription</Label>
        <p className="text-muted-foreground mb-6 text-sm">
          Your subscription not only grants you access to additional features,
          but also directly empowers the continued development of Rallly.
        </p>
        <div className="mb-6 flex items-center gap-4">
          <Switch
            checked={isBilledAnnually}
            onChange={(checked) => {
              setBilledAnnually(checked);
            }}
          />
          <Label>Annual billing (Save 58%)</Label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Card className="flex flex-col divide-y">
            <div className="p-4">
              <h2 className="mb-4">Free</h2>
              <div>
                <span className="text-3xl font-bold">$0</span>
                <div className="text-muted-foreground text-sm">
                  free forever
                </div>
              </div>
            </div>
            <div className="flex grow flex-col p-4">
              <ul className="text-muted-foreground grow text-sm">
                <li>Unlimited polls</li>
                <li>Unlimited participants</li>
              </ul>
              <div className="mt-6">
                <Button className="w-full" disabled>
                  Current Plan
                </Button>
              </div>
            </div>
          </Card>
          <Card className="border-primary ring-primary divide-y ring-1">
            <div className="bg-pattern p-4">
              <div className="mb-4 flex items-center gap-x-2">
                <h2 className="text-primary">Plus</h2>
              </div>
              {isBilledAnnually ? (
                <div>
                  <span className="mr-2 text-xl font-bold line-through">
                    $5
                  </span>
                  <span className="text-3xl font-bold">$2.08</span>
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
              <ul className="text-muted-foreground text-sm">
                <li>Unlimited polls</li>
                <li>Unlimited participants</li>
                <li>Finalize polls</li>
                <li>Extended poll life</li>
                <li>Priority support</li>
                <li>Access to new features</li>
              </ul>
              <div className="mt-6">
                <Button
                  className="w-full"
                  variant="primary"
                  onClick={() => {
                    window.Paddle.Checkout.open({
                      allowQuantity: false,
                      product: 53102,
                      email: user.email,
                      disableLogout: true,
                      passthrough: JSON.stringify({ userId: user.id }),
                      successCallback: () => {
                        // fetch user till we get the new plan
                      },
                    });
                  }}
                >
                  Upgrade
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }
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
        title={<Trans i18nKey="plan" defaults="Plan" />}
        description={
          <Trans i18nKey="planDescription" defaults="Choose your plan" />
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
