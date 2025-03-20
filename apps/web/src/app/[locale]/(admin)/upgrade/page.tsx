"use client";

import { pricingData } from "@rallly/billing/pricing";
import { Badge } from "@rallly/ui/badge";
import { RadioGroup, RadioGroupItem } from "@rallly/ui/radio-group";
import { CheckIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

import {
  PageContainer,
  PageContent,
  PageHeader,
  PageSection,
  PageSectionTitle,
  PageTitle,
} from "@/app/components/page-layout";
import { Trans } from "@/components/trans";
import { UpgradeButton } from "@/components/upgrade-button";

const annualSavingsPercentage = (
  ((pricingData.monthly.amount * 12 - pricingData.yearly.amount) /
    (pricingData.monthly.amount * 12)) *
  100
).toFixed(0);

const yearlyPrice = (pricingData.yearly.amount / 100).toFixed(2);
const monthlyPrice = (pricingData.monthly.amount / 100).toFixed(2);
const monthlyPriceAnnualRate = (pricingData.yearly.amount / 100 / 12).toFixed(
  2,
);

export default function UpgradePage() {
  const [period, setPeriod] = React.useState("yearly");

  return (
    <PageContainer>
      <PageHeader className="text-center">
        <PageTitle>
          <Trans i18nKey="upgradePromptTitle" defaults="Upgrade to Pro" />
        </PageTitle>
      </PageHeader>
      <PageContent className="mx-auto max-w-2xl">
        <PageSection>
          <div className="mb-6 text-center">
            <Badge size="lg" variant="primary" className="mx-auto">
              <Trans i18nKey="planPro" defaults="Pro" />
            </Badge>
            <p className="text-muted-foreground mt-4 text-center text-sm leading-relaxed">
              <Trans
                i18nKey="upgradeOverlaySubtitle3"
                defaults="Unlock these features by upgrading to a Pro plan."
              />
            </p>
          </div>

          <div className="bg-card mb-8 rounded-lg border p-6">
            <PageSectionTitle>
              <Trans i18nKey="proFeatures" defaults="Pro Features" />
            </PageSectionTitle>
            <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <li className="flex items-start">
                <CheckIcon className="mr-2 mt-0.5 size-4 shrink-0 text-green-600" />
                <span>
                  <Trans
                    i18nKey="featureNameFinalize"
                    defaults="Finalize Poll"
                  />
                </span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="mr-2 mt-0.5 size-4 shrink-0 text-green-600" />
                <span>
                  <Trans
                    i18nKey="featureNameDuplicate"
                    defaults="Duplicate Poll"
                  />
                </span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="mr-2 mt-0.5 size-4 shrink-0 text-green-600" />
                <span>
                  <Trans
                    i18nKey="featureNameAdvancedSettings"
                    defaults="Advanced Settings"
                  />
                </span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="mr-2 mt-0.5 size-4 shrink-0 text-green-600" />
                <span>
                  <Trans
                    i18nKey="featureNameExtendedPollLifetime"
                    defaults="Extended Poll Lifetime"
                  />
                </span>
              </li>
            </ul>
          </div>

          <div className="mb-8">
            <PageSectionTitle>
              <Trans i18nKey="choosePlan" defaults="Choose a Plan" />
            </PageSectionTitle>
            <RadioGroup
              value={period}
              onValueChange={setPeriod}
              className="mt-4 space-y-4"
            >
              <li className="focus-within:ring-primary bg-card relative flex items-center justify-between rounded-lg border p-4 focus-within:ring-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-4">
                    <RadioGroupItem id="yearly" value="yearly" />
                    <label className="text-base font-semibold" htmlFor="yearly">
                      <span role="presentation" className="absolute inset-0" />
                      <Trans defaults="12 months" i18nKey="12months" />
                    </label>
                    <Badge variant="green">
                      <Trans
                        defaults="Save {percentage}%"
                        i18nKey="savePercentage"
                        values={{ percentage: annualSavingsPercentage }}
                      />
                    </Badge>
                  </div>
                  <p className="text-muted-foreground flex items-baseline gap-1.5 pl-8 text-sm">
                    <span>${yearlyPrice}</span>
                    <span className="line-through opacity-50">
                      ${((pricingData.monthly.amount * 12) / 100).toFixed(2)}
                    </span>
                  </p>
                </div>
                <p className="flex items-baseline gap-1">
                  <span className="text-xl font-semibold">
                    ${monthlyPriceAnnualRate}
                  </span>
                  <span className="text-muted-foreground text-sm">/ mo</span>
                </p>
              </li>
              <li className="focus-within:ring-primary bg-card relative flex items-center justify-between rounded-lg border p-4 focus-within:ring-2">
                <div className="flex items-center gap-4">
                  <RadioGroupItem id="monthly" value="monthly" />
                  <label className="text-base font-semibold" htmlFor="monthly">
                    <span role="presentation" className="absolute inset-0" />
                    <Trans defaults="1 month" i18nKey="1month" />
                  </label>
                </div>
                <p className="flex items-baseline gap-1">
                  <span className="text-xl font-semibold">${monthlyPrice}</span>
                  <span className="text-muted-foreground text-sm">/ mo</span>
                </p>
              </li>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <UpgradeButton large annual={period === "yearly"}>
              <Trans i18nKey="subscribe" defaults="Subscribe" />
            </UpgradeButton>
            <p className="text-muted-foreground text-center text-sm">
              <Trans
                i18nKey="cancelAnytime"
                defaults="Cancel anytime from your <a>billing page</a>."
                components={{
                  a: <Link className="text-link" href="/settings/billing" />,
                }}
              />
            </p>
          </div>
        </PageSection>
      </PageContent>
    </PageContainer>
  );
}
