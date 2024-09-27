"use client";

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
import Link from "next/link";
import React from "react";
import { Trans } from "react-i18next/TransWithoutContext";

import { useTranslation } from "@/i18n/client";
import { linkToApp } from "@/lib/linkToApp";

export function PriceTables() {
  const { t } = useTranslation("pricing");
  const [tab, setTab] = React.useState("yearly");
  return (
    <Tabs value={tab} onValueChange={setTab}>
      <div className="flex justify-center">
        <TabsList className="mb-4 sm:mb-6">
          <TabsTrigger value="monthly">
            <Trans
              t={t}
              ns="pricing"
              i18nKey="billingPeriodMonthly"
              defaults="Monthly"
            />
          </TabsTrigger>
          <TabsTrigger value="yearly" className="inline-flex gap-x-2.5">
            <Trans
              t={t}
              ns="pricing"
              i18nKey="billingPeriodYearly"
              defaults="Yearly"
            />
          </TabsTrigger>
        </TabsList>
      </div>
      <div className="mx-auto grid gap-4 sm:gap-6 md:grid-cols-2">
        <BillingPlan>
          <BillingPlanHeader>
            <BillingPlanTitle>
              <Trans t={t} ns="pricing" i18nKey="planFree" defaults="Free" />
            </BillingPlanTitle>
            <BillingPlanDescription>
              <Trans
                t={t}
                ns="pricing"
                i18nKey="planFreeDescription"
                defaults="For casual users"
              />
            </BillingPlanDescription>
          </BillingPlanHeader>
          <div>
            <BillingPlanPrice>$0</BillingPlanPrice>
            <BillingPlanPeriod>
              <Trans
                t={t}
                ns="pricing"
                i18nKey="freeForever"
                defaults="free forever"
              />
            </BillingPlanPeriod>
          </div>
          <hr />
          <Button asChild className="w-full">
            <Link href={linkToApp("/")}>
              <Trans
                t={t}
                ns="common"
                i18nKey="getStarted"
                defaults="Get started"
              />
            </Link>
          </Button>
          <BillingPlanPerks>
            <BillingPlanPerk>
              <Trans
                t={t}
                ns="pricing"
                i18nKey="limitedAccess"
                defaults="Access to core features"
              />
            </BillingPlanPerk>
            <BillingPlanPerk>
              <Trans
                t={t}
                ns="pricing"
                i18nKey="pollsDeleted"
                defaults="Polls are automatically deleted once they become inactive"
              />
            </BillingPlanPerk>
          </BillingPlanPerks>
        </BillingPlan>
        <BillingPlan className="relative">
          <BillingPlanHeader>
            <BillingPlanTitle>
              <Trans t={t} ns="pricing" i18nKey="planPro" defaults="Pro" />
            </BillingPlanTitle>
            <BillingPlanDescription>
              <Trans
                t={t}
                ns="pricing"
                i18nKey="planProDescription"
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
                  t={t}
                  ns="pricing"
                  i18nKey="annualBenefit"
                  defaults="{count} months free!"
                  values={{
                    count: 4,
                  }}
                />
              </Badge>
            </div>
            <BillingPlanPeriod>
              <Trans
                t={t}
                ns="pricing"
                i18nKey="yearlyBillingDescription"
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
                t={t}
                ns="pricing"
                i18nKey="monthlyBillingDescription"
                defaults="per month"
              />
            </BillingPlanPeriod>
          </TabsContent>
          <hr />
          <Button asChild variant="primary" className="w-full">
            <Link href={linkToApp("/settings/billing")}>
              <Trans
                t={t}
                ns="pricing"
                i18nKey="upgrade"
                defaults="Go to billing"
              />
            </Link>
          </Button>
          <BillingPlanPerks>
            <BillingPlanPerk pro={true}>
              <Trans
                t={t}
                ns="pricing"
                i18nKey="accessAllFeatures"
                defaults="Access all features"
              />
            </BillingPlanPerk>
            <BillingPlanPerk pro={true}>
              <Trans
                t={t}
                ns="pricing"
                i18nKey="keepPollsIndefinitely"
                defaults="Keep polls indefinitely"
              />
            </BillingPlanPerk>
            <BillingPlanPerk pro={true}>
              <Trans
                t={t}
                ns="pricing"
                i18nKey="getEarlyAccess"
                defaults="Get early access to new features"
              />
            </BillingPlanPerk>
          </BillingPlanPerks>
        </BillingPlan>
      </div>
    </Tabs>
  );
}
