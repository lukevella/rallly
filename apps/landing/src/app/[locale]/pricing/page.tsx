import { Button } from "@rallly/ui/button";
import { TrendingUpIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { Trans } from "react-i18next/TransWithoutContext";

import { getTranslation } from "@/i18n/server";
import { linkToApp } from "@/lib/linkToApp";

import { PriceTables } from "./pricing-table";

const FAQ = async ({ locale }: { locale: string }) => {
  const { t } = await getTranslation(locale, ["pricing"]);
  return (
    <div className="rounded-md p-6">
      <h2 className="mb-4 sm:mb-6">
        <Trans
          t={t}
          ns="pricing"
          i18nKey="faq"
          defaults="Frequently Asked Questions"
        />
      </h2>
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 gap-x-8 gap-y-2">
          <h3 className="col-span-1">
            <Trans
              t={t}
              ns="pricing"
              i18nKey="canUseFree"
              defaults="Can I use Rallly for free?"
            />
          </h3>
          <p className="col-span-2 text-sm leading-relaxed text-slate-600">
            <Trans
              t={t}
              ns="pricing"
              i18nKey="canUseFreeAnswer2"
              defaults="Yes, most of Rallly's features are free and many users will never need to pay for anything. However, there are some features that are only available to paying customers. These features are designed to help you get the most out of Rallly."
            />
          </p>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-2">
          <h3 className="col-span-1">
            <Trans
              t={t}
              ns="pricing"
              i18nKey="whyUpgrade"
              defaults="Why should I upgrade?"
            />
          </h3>
          <p className="col-span-2 text-sm leading-relaxed text-slate-600">
            <Trans
              t={t}
              ns="pricing"
              i18nKey="whyUpgradeAnswer2"
              defaults="Upgrading to a paid plan makes sense if you use Rallly often or use it for work. The current subscription rate is a special early adopter rate and will increase in the future. By upgrading now, you will get early access to new, high-quality scheduling tools as they are released and lock in your subscription rate so you won't be affected by future price increases."
            />
          </p>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-2">
          <h3 className="col-span-1">
            <Trans
              t={t}
              ns="pricing"
              i18nKey="whenPollInactive"
              defaults="When does a poll become inactive?"
            />
          </h3>
          <p className="col-span-2 text-sm leading-relaxed text-slate-600">
            <Trans
              t={t}
              ns="pricing"
              i18nKey="whenPollInactiveAnswer"
              defaults="Polls become inactive when all date options are in the past AND the poll has not been accessed for over 30 days. Inactive polls are automatically deleted if you do not have a paid subscription."
            />
          </p>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-2">
          <h3 className="col-span-1">
            <Trans
              t={t}
              ns="pricing"
              i18nKey="howToUpgrade"
              defaults="How do I upgrade to a paid plan?"
            />
          </h3>
          <p className="col-span-2 text-sm leading-relaxed text-slate-600">
            <Trans
              t={t}
              ns="pricing"
              i18nKey="howToUpgradeAnswer"
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
              t={t}
              ns="pricing"
              i18nKey="cancelSubscription"
              defaults="How do I cancel my subscription?"
            />
          </h3>
          <p className="col-span-2 text-sm leading-relaxed text-slate-600">
            <Trans
              t={t}
              ns="pricing"
              i18nKey="cancelSubscriptionAnswer"
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

export const UpgradeButton = async ({
  locale,
  children,
  annual,
}: React.PropsWithChildren<{ annual?: boolean; locale: string }>) => {
  const { t } = await getTranslation(locale, ["common", "pricing"]);
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
        {children || (
          <Trans t={t} ns="pricing" i18nKey="upgrade" defaults="Upgrade" />
        )}
      </Button>
    </form>
  );
};

export default async function Page({ params }: { params: { locale: string } }) {
  const { t } = await getTranslation(params.locale, ["common", "pricing"]);
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 text-center sm:mb-6">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          <Trans t={t} ns="pricing" i18nKey="pricing">
            Pricing
          </Trans>
        </h1>
        <p className="text-muted-foreground text-lg">
          <Trans
            t={t}
            ns="pricing"
            i18nKey="pricingDescription"
            defaults="Get started for free. No login required."
          />
        </p>
      </div>
      <div className="space-y-4 sm:space-y-6">
        <PriceTables />
        <div className="rounded-md border bg-gradient-to-b from-cyan-50 to-cyan-50/60 px-5 py-4 text-cyan-800">
          <div className="mb-2">
            <TrendingUpIcon className="text-indigo mr-2 mt-0.5 size-6 shrink-0" />
          </div>
          <div className="mb-1 flex items-center gap-x-2">
            <h3 className="text-sm">
              <Trans
                t={t}
                ns="pricing"
                i18nKey="upgradeNowSaveLater"
                defaults="Upgrade now, save later"
              />
            </h3>
          </div>
          <p className="text-sm">
            <Trans
              t={t}
              ns="pricing"
              i18nKey="earlyAdopterDescription"
              defaults="As an early adopter, you'll lock in your subscription rate and won't be affected by future price increases."
            />
          </p>
        </div>
        <hr />
        <FAQ locale={params.locale} />
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const { t } = await getTranslation(params.locale, ["common", "pricing"]);
  return {
    title: t("pricing", { ns: "common", defaultValue: "Pricing" }),
    description: t("pricingDescription", {
      ns: "pricing",
    }),
  };
}
