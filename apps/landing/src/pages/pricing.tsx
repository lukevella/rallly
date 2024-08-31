import { pricingData } from "@rallly/billing/pricing";
import { Badge } from "@rallly/ui/badge";
import {
  BillingPlan,
  BillingPlanDescription,
  BillingPlanHeader,
  BillingPlanPeriod,
  BillingPlanPerk,
  BillingPlanPerks,
  BillingPlanPrice,
  BillingPlanTitle,
} from "@rallly/ui/billing-plan";
import { Button } from "@rallly/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rallly/ui/tabs";
import { TrendingUpIcon } from "lucide-react";
import { GetStaticProps } from "next";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { NextSeo } from "next-seo";
import React from "react";

import { getPageLayout } from "@/components/layouts/page-layout";
import { Trans } from "@/components/trans";
import { linkToApp } from "@/lib/linkToApp";
import { NextPageWithLayout } from "@/types";
import { getStaticTranslations } from "@/utils/page-translations";

export const UpgradeButton = ({
  children,
  annual,
}: React.PropsWithChildren<{ annual?: boolean }>) => {
  return (
    <form method="POST" action={linkToApp("/api/stripe/checkout")}>
      <input
        type="hidden"
        name="period"
        value={annual ? "yearly" : "monthly"}
      />
      <input
        type="hidden"
        name="return_path"
        value={window.location.pathname}
      />
      <Button className="w-full" type="submit" variant="primary">
        {children || <Trans i18nKey="pricing:upgrade" defaults="Upgrade" />}
      </Button>
    </form>
  );
};

const PriceTables = ({
  pricingData,
}: {
  pricingData: {
    monthly: {
      amount: number;
      currency: string;
    };
    yearly: {
      amount: number;
      currency: string;
    };
  };
}) => {
  const [tab, setTab] = React.useState("yearly");
  return (
    <Tabs value={tab} onValueChange={setTab}>
      <div className="flex justify-center">
        <TabsList className="mb-4 sm:mb-6">
          <TabsTrigger value="monthly">
            <Trans i18nKey="pricing:billingPeriodMonthly" defaults="Monthly" />
          </TabsTrigger>
          <TabsTrigger value="yearly" className="inline-flex gap-x-2.5">
            <Trans i18nKey="pricing:billingPeriodYearly" defaults="Yearly" />
          </TabsTrigger>
        </TabsList>
      </div>
      <div className="mx-auto grid gap-4 sm:gap-6 md:grid-cols-2">
        <BillingPlan>
          <BillingPlanHeader>
            <BillingPlanTitle>
              <Trans i18nKey="pricing:planFree" defaults="Free" />
            </BillingPlanTitle>
            <BillingPlanDescription>
              <Trans
                i18nKey="pricing:planFreeDescription"
                defaults="For casual users"
              />
            </BillingPlanDescription>
          </BillingPlanHeader>
          <div>
            <BillingPlanPrice>$0</BillingPlanPrice>
            <BillingPlanPeriod>
              <Trans i18nKey="pricing:freeForever" defaults="free forever" />
            </BillingPlanPeriod>
          </div>
          <hr />
          <Button asChild className="w-full">
            <Link href={linkToApp("/")}>
              <Trans i18nKey="common:getStarted" defaults="Get started" />
            </Link>
          </Button>
          <BillingPlanPerks>
            <BillingPlanPerk>
              <Trans
                i18nKey="pricing:limitedAccess"
                defaults="Access to core features"
              />
            </BillingPlanPerk>
            <BillingPlanPerk>
              <Trans
                i18nKey="pricing:pollsDeleted"
                defaults="Polls are automatically deleted once they become inactive"
              />
            </BillingPlanPerk>
          </BillingPlanPerks>
        </BillingPlan>
        <BillingPlan className="relative">
          <BillingPlanHeader>
            <BillingPlanTitle>
              <Trans i18nKey="pricing:planPro" defaults="Pro" />
            </BillingPlanTitle>
            <BillingPlanDescription>
              <Trans
                i18nKey="pricing:planProDescription"
                defaults="For power users and professionals"
              />
            </BillingPlanDescription>
          </BillingPlanHeader>
          <TabsContent value="yearly">
            <div className="flex items-center gap-x-2">
              <BillingPlanPrice>
                ${pricingData.yearly.amount / 100}
              </BillingPlanPrice>
              <Badge variant="green" className="inline-flex gap-2">
                <Trans
                  i18nKey="pricing:annualBenefit"
                  defaults="{count} months free!"
                  values={{
                    count: 4,
                  }}
                />
              </Badge>
            </div>
            <BillingPlanPeriod>
              <Trans
                i18nKey="pricing:yearlyBillingDescription"
                defaults="per year"
              />
            </BillingPlanPeriod>
          </TabsContent>
          <TabsContent value="monthly">
            <BillingPlanPrice>
              ${pricingData.monthly.amount / 100}
            </BillingPlanPrice>
            <BillingPlanPeriod>
              <Trans
                i18nKey="pricing:monthlyBillingDescription"
                defaults="per month"
              />
            </BillingPlanPeriod>
          </TabsContent>
          <hr />
          <Button asChild variant="primary" className="w-full">
            <Link href={linkToApp("/settings/billing")}>
              <Trans i18nKey="pricing:upgrade" defaults="Go to billing" />
            </Link>
          </Button>
          <BillingPlanPerks>
            <BillingPlanPerk pro={true}>
              <Trans
                i18nKey="pricing:accessAllFeatures"
                defaults="Access all features"
              />
            </BillingPlanPerk>
            <BillingPlanPerk pro={true}>
              <Trans
                i18nKey="pricing:keepPollsIndefinitely"
                defaults="Keep polls indefinitely"
              />
            </BillingPlanPerk>
            <BillingPlanPerk pro={true}>
              <Trans
                i18nKey="pricing:getEarlyAccess"
                defaults="Get early access to new features"
              />
            </BillingPlanPerk>
          </BillingPlanPerks>
        </BillingPlan>
      </div>
    </Tabs>
  );
};

const FAQ = () => {
  return (
    <div className="rounded-md p-6">
      <h2 className="mb-4 sm:mb-6">
        <Trans i18nKey="pricing:faq" defaults="Frequently Asked Questions" />
      </h2>
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 gap-x-8 gap-y-2">
          <h3 className="col-span-1">
            <Trans
              i18nKey="pricing:canUseFree"
              defaults="Can I use Rallly for free?"
            />
          </h3>
          <p className="col-span-2 text-sm leading-relaxed text-slate-600">
            <Trans
              i18nKey="pricing:canUseFreeAnswer2"
              defaults="Yes, most of Rallly's features are free and many users will never need to pay for anything. However, there are some features that are only available to paying customers. These features are designed to help you get the most out of Rallly."
            />
          </p>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-2">
          <h3 className="col-span-1">
            <Trans
              i18nKey="pricing:whyUpgrade"
              defaults="Why should I upgrade?"
            />
          </h3>
          <p className="col-span-2 text-sm leading-relaxed text-slate-600">
            <Trans
              i18nKey="pricing:whyUpgradeAnswer2"
              defaults="Upgrading to a paid plan makes sense if you use Rallly often or use it for work. The current subscription rate is a special early adopter rate and will increase in the future. By upgrading now, you will get early access to new, high-quality scheduling tools as they are released and lock in your subscription rate so you won't be affected by future price increases."
            />
          </p>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-2">
          <h3 className="col-span-1">
            <Trans
              i18nKey="pricing:whenPollInactive"
              defaults="When does a poll become inactive?"
            />
          </h3>
          <p className="col-span-2 text-sm leading-relaxed text-slate-600">
            <Trans
              i18nKey="pricing:whenPollInactiveAnswer"
              defaults="Polls become inactive when all date options are in the past AND the poll has not been accessed for over 30 days. Inactive polls are automatically deleted if you do not have a paid subscription."
            />
          </p>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-2">
          <h3 className="col-span-1">
            <Trans
              i18nKey="pricing:howToUpgrade"
              defaults="How do I upgrade to a paid plan?"
            />
          </h3>
          <p className="col-span-2 text-sm leading-relaxed text-slate-600">
            <Trans
              i18nKey="pricing:howToUpgradeAnswer"
              components={{
                a: (
                  <Link
                    className="text-link"
                    href={linkToApp("/settings/billing")}
                  />
                ),
                b: <strong />,
              }}
              defaults="To upgrade, you can go to your <a>billing settings</a> and click on <b>Upgrade</b>."
            />
          </p>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-2">
          <h3 className="col-span-1">
            <Trans
              i18nKey="pricing:cancelSubscription"
              defaults="How do I cancel my subscription?"
            />
          </h3>
          <p className="col-span-2 text-sm leading-relaxed text-slate-600">
            <Trans
              i18nKey="pricing:cancelSubscriptionAnswer"
              components={{
                a: (
                  <Link
                    className="text-link"
                    href={linkToApp("/settings/billing")}
                  />
                ),
                b: <strong />,
              }}
              defaults="You can cancel your subscription at any time by going to your <a>billing settings</a>. Once you cancel your subscription, you will still have access to your paid plan until the end of your billing period. After that, you will be downgraded to a free plan."
            />
          </p>
        </div>
      </div>
    </div>
  );
};

const Page: NextPageWithLayout = () => {
  const { t } = useTranslation(["pricing"]);
  return (
    <div className="mx-auto max-w-3xl">
      <NextSeo
        title={t("common:pricing", { defaultValue: "Pricing" })}
        description={t("pricing:pricingDescription")}
      />
      <div className="mb-4 text-center sm:mb-6">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          <Trans i18nKey="pricing:pricing">Pricing</Trans>
        </h1>
        <p className="text-muted-foreground text-lg">
          <Trans
            i18nKey="pricing:pricingDescription"
            defaults="Get started for free. No login required."
          />
        </p>
      </div>
      <div className="space-y-4 sm:space-y-6">
        <PriceTables pricingData={pricingData} />
        <div className="rounded-md border bg-gradient-to-b from-cyan-50 to-cyan-50/60 px-5 py-4 text-cyan-800">
          <div className="mb-2">
            <TrendingUpIcon className="text-indigo mr-2 mt-0.5 size-6 shrink-0" />
          </div>
          <div className="mb-1 flex items-center gap-x-2">
            <h3 className="text-sm">
              <Trans
                i18nKey="pricing:upgradeNowSaveLater"
                defaults="Upgrade now, save later"
              />
            </h3>
          </div>
          <p className="text-sm">
            <Trans
              i18nKey="pricing:earlyAdopterDescription"
              defaults="As an early adopter, you'll lock in your subscription rate and won't be affected by future price increases."
            />
          </p>
        </div>
        <hr />
        <FAQ />
      </div>
    </div>
  );
};

Page.getLayout = getPageLayout;

export default Page;

export const getStaticProps: GetStaticProps = async (ctx) => {
  const res = await getStaticTranslations(["pricing"])(ctx);
  if ("props" in res) {
    return {
      props: {
        ...res.props,
      },
    };
  }
  return res;
};
