import type { TFunction } from "i18next";
import { TrendingUpIcon } from "lucide-react";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import { getTranslation } from "@/i18n/server";
import { linkToApp } from "@/lib/linkToApp";

import { PriceTables } from "./pricing-table";

const FAQ = async ({ t }: { t: TFunction }) => {
  return (
    <section>
      <h2 className="text-2xl font-bold">
        <Trans
          t={t}
          ns="pricing"
          i18nKey="faq"
          defaults="Frequently Asked Questions"
        />
      </h2>
      <h3 className="mb-2 mt-6 text-lg font-bold">
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
      <h3 className="mb-2 mt-6 text-lg font-bold">
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
      <h3 className="mb-2 mt-6 text-lg font-bold">
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
      <h3 className="mb-2 mt-6 text-lg font-bold">
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

      <h3 className="mb-2 mt-6 text-lg font-bold">
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
    </section>
  );
};

export default async function Page({ params }: { params: { locale: string } }) {
  const { t } = await getTranslation(params.locale, ["common", "pricing"]);
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2 sm:p-6 sm:text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
          <Trans
            t={t}
            ns="pricing"
            i18nKey="pricingTitle"
            defaults="Get started for free"
          />
        </h1>
        <p className="text-muted-foreground text-lg">
          <Trans
            t={t}
            ns="pricing"
            i18nKey="pricingSubtitle"
            defaults="Upgrade to a paid plan to get access to premium features"
          />
        </p>
      </header>
      <section>
        <PriceTables />
      </section>
      <section>
        <div className="flex flex-col gap-4 rounded-md border border-cyan-800/10 bg-gradient-to-b from-cyan-50 to-cyan-50/60 p-4 text-cyan-800 shadow-sm sm:flex-row sm:gap-6 sm:p-5">
          <div>
            <TrendingUpIcon className="size-6" />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-bold">
              <Trans
                t={t}
                ns="pricing"
                i18nKey="upgradeNowSaveLater"
                defaults="Upgrade now, save later"
              />
            </h3>
            <p className="text-sm">
              <Trans
                t={t}
                ns="pricing"
                i18nKey="earlyAdopterDescription"
                defaults="As an early adopter, you'll lock in your subscription rate and won't be affected by future price increases."
              />
            </p>
          </div>
        </div>
      </section>
      <hr className="border-transparent" />
      <FAQ t={t} />
    </article>
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
