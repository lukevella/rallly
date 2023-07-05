import { CheckIcon, InfoIcon } from "@rallly/icons";
import {
  BillingPlan,
  BillingPlanFooter,
  BillingPlanHeader,
  BillingPlanPeriod,
  BillingPlanPerk,
  BillingPlanPerks,
  BillingPlanPrice,
  BillingPlanTitle,
} from "@rallly/ui/billing-plan";
import { Button } from "@rallly/ui/button";
import { Label } from "@rallly/ui/label";
import { Switch } from "@rallly/ui/switch";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { NextSeo } from "next-seo";
import React from "react";

import { getPageLayout } from "@/components/layouts/page-layout";
import { Trans } from "@/components/trans";
import { linkToApp } from "@/lib/linkToApp";
import { NextPageWithLayout } from "@/types";
import { getStaticTranslations } from "@/utils/page-translations";

const Perk = ({ children }: React.PropsWithChildren) => {
  return (
    <li className="flex">
      <CheckIcon className="mr-2 inline h-4 w-4 translate-y-0.5 -translate-x-0.5 text-green-600" />
      <span>{children}</span>
    </li>
  );
};

const monthlyPriceUsd = 5;
const annualPriceUsd = 30;

const Page: NextPageWithLayout = () => {
  const { t } = useTranslation();
  const [annualBilling, setAnnualBilling] = React.useState(true);
  return (
    <div className="mx-auto bg-gray-100">
      <NextSeo title={t("pricing", { defaultValue: "Pricing" })} />
      <h1 className="mb-4 text-4xl font-bold tracking-tight">
        <Trans i18nKey="pricing">Pricing</Trans>
      </h1>
      <p className="text-muted-foreground text-lg">
        <Trans
          i18nKey="pricingDescription"
          defaults="Get started for free. No login required."
        />
      </p>
      <div className="my-8">
        <div className="mb-4 flex items-center gap-x-2">
          <Switch
            id="annual-billing"
            checked={annualBilling}
            onCheckedChange={setAnnualBilling}
          />
          <Label htmlFor="annual-billing">
            <Trans
              i18nKey="annualBilling"
              values={{ discount: 50 }}
              defaults="Annual billing (Save {discount}%)"
            />
          </Label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <BillingPlan>
            <BillingPlanHeader>
              <BillingPlanTitle>
                <Trans i18nKey="planFree" defaults="Free" />
              </BillingPlanTitle>
              <BillingPlanPrice>$0</BillingPlanPrice>
              <BillingPlanPeriod>
                <Trans i18nKey="freeForever" defaults="free forever" />
              </BillingPlanPeriod>
            </BillingPlanHeader>
            <BillingPlanPerks>
              <BillingPlanPerk>
                <Trans
                  i18nKey="plan_unlimitedPolls"
                  defaults="Unlimited polls"
                />
              </BillingPlanPerk>
              <BillingPlanPerk>
                <Trans
                  i18nKey="plan_unlimitedParticipants"
                  defaults="Unlimited participants"
                />
              </BillingPlanPerk>
            </BillingPlanPerks>
            <BillingPlanFooter>
              <Button className="w-full" asChild>
                <Link href={linkToApp()}>
                  <Trans i18nKey="getStarted">Get started for free</Trans>
                </Link>
              </Button>
            </BillingPlanFooter>
          </BillingPlan>
          <BillingPlan variant="primary">
            <BillingPlanHeader>
              <BillingPlanTitle className="text-primary m-0">
                <Trans i18nKey="planPro" defaults="Pro" />
              </BillingPlanTitle>
              {annualBilling ? (
                <>
                  <BillingPlanPrice
                    discount={`$${(annualPriceUsd / 12).toFixed(2)}`}
                  >
                    ${monthlyPriceUsd}
                  </BillingPlanPrice>
                  <BillingPlanPeriod>
                    <Trans
                      i18nKey="annualBillingDescription"
                      defaults="per month, billed annually"
                    />
                  </BillingPlanPeriod>
                </>
              ) : (
                <>
                  <BillingPlanPrice>${monthlyPriceUsd}</BillingPlanPrice>
                  <BillingPlanPeriod>
                    <Trans
                      i18nKey="monthlyBillingDescription"
                      defaults="per month"
                    />
                  </BillingPlanPeriod>
                </>
              )}
            </BillingPlanHeader>
            <BillingPlanPerks>
              <BillingPlanPerk>
                <Trans
                  i18nKey="plan_unlimitedPolls"
                  defaults="Unlimited polls"
                />
              </BillingPlanPerk>
              <BillingPlanPerk>
                <Trans
                  i18nKey="plan_unlimitedParticipants"
                  defaults="Unlimited participants"
                />
              </BillingPlanPerk>
              <Perk>
                <Trans i18nKey="plan_finalizePolls" defaults="Finalize polls" />
              </Perk>
              <BillingPlanPerk>
                <Trans
                  i18nKey="plan_extendedPollLife"
                  defaults="Extended poll life"
                />
              </BillingPlanPerk>
              <BillingPlanPerk>
                <Trans
                  i18nKey="plan_prioritySupport"
                  defaults="Priority support"
                />
              </BillingPlanPerk>
            </BillingPlanPerks>
            <BillingPlanFooter>
              <Button variant="primary" className="w-full" asChild>
                <Link href={linkToApp("/settings/billing")}>
                  <Trans i18nKey="upgrade">Upgrade</Trans>
                </Link>
              </Button>
            </BillingPlanFooter>
          </BillingPlan>
        </div>
        <p className="text-muted-foreground mt-8 flex flex-col gap-x-2 gap-y-2 text-sm sm:flex-row sm:items-center sm:justify-center sm:text-center">
          <InfoIcon className="h-4 w-4" />
          <Trans i18nKey="priceIncreaseInfo">
            Prices will be adjusted regularly as more features are added
          </Trans>
        </p>
      </div>
      <hr className="my-8" />
      <div>
        <h2 className="mb-4">
          <Trans i18nKey="faq" defaults="Frequently Asked Questions"></Trans>
        </h2>
        <div className="divide-y">
          <div className="grid gap-x-8 gap-y-2 py-4 md:grid-cols-3">
            <h3 className="col-span-1">
              <Trans
                i18nKey="faq_canUseFree"
                defaults="Can I use Rallly for free?"
              ></Trans>
            </h3>
            <p className="col-span-2 text-sm leading-relaxed text-slate-600">
              <Trans
                i18nKey="faq_canUseFreeAnswer"
                components={{
                  a: (
                    <Link
                      className="text-link"
                      href="https://app.rallly.co/settings/billing"
                    />
                  ),
                  b: <strong />,
                }}
                defaults="Yes, as a free user you can create polls and get insight into your participant's availability. You will still see the results of your poll but you won't be able to select a final date or send calendar invites."
              ></Trans>
            </p>
          </div>
          <div className="grid gap-x-8 gap-y-2 py-4 md:grid-cols-3">
            <h3 className="col-span-1">
              <Trans
                i18nKey="faq_whyUpgrade"
                defaults="Why should I upgrade?"
              ></Trans>
            </h3>
            <p className="col-span-2 text-sm leading-relaxed text-slate-600">
              <Trans
                i18nKey="faq_whyUpgradeAnswer"
                defaults="When you upgrade to a paid plan, you will be able to finalize your polls and automatically send calendar invites to your participants with your selected date. We will also keep your polls indefinitely so they won't be automatically deleted even after they are finalized."
              ></Trans>
            </p>
          </div>
          <div className="grid gap-x-8 gap-y-2 py-4 md:grid-cols-3">
            <h3 className="col-span-1">
              <Trans
                i18nKey="faq_howToUpgrade"
                defaults="How do I upgrade to a paid plan?"
              />
            </h3>
            <p className="col-span-2 text-sm leading-relaxed text-slate-600">
              <Trans
                i18nKey="faq_howToUpgradeAnswer"
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
          <div className="grid gap-x-8 gap-y-2 py-4 md:grid-cols-3">
            <h3 className="col-span-1">
              <Trans
                i18nKey="faq_cancelSubscription"
                defaults="How do I cancel my subscription?"
              ></Trans>
            </h3>
            <p className="col-span-2 text-sm leading-relaxed text-slate-600">
              <Trans
                i18nKey="faq_cancelSubscriptionAnswer"
                components={{
                  a: <Link className="text-link" href="/settings/billing" />,
                  b: <strong />,
                }}
                defaults="You can cancel your subscription at any time by going to your <a>billing settings</a>. Once you cancel your subscription, you will still have access to your paid plan until the end of your billing period. After that, you will be downgraded to a free plan."
              ></Trans>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

Page.getLayout = getPageLayout;

export default Page;

export const getStaticProps = getStaticTranslations;
