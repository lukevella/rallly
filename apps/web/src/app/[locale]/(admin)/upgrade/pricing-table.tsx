"use client";

import { RadioGroup, RadioGroupItem } from "@radix-ui/react-radio-group";
import { pricingData } from "@rallly/billing/pricing";
import { cn } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { CheckIcon } from "lucide-react";
import React from "react";

import { Trans } from "@/components/trans";
import { UpgradeButton } from "@/components/upgrade-button";

export type PricingPeriod = "monthly" | "yearly";

interface PricingTableProps {
  period: PricingPeriod;
  onPeriodChange: (period: PricingPeriod) => void;
}

const yearlyPrice = (pricingData.yearly.amount / 100).toFixed(2);
const monthlyPrice = (pricingData.monthly.amount / 100).toFixed(2);
const monthlyPriceAnnualRate = (pricingData.yearly.amount / 100 / 12).toFixed(
  2,
);

const annualSavingsPercentage = (
  ((pricingData.monthly.amount * 12 - pricingData.yearly.amount) /
    (pricingData.monthly.amount * 12)) *
  100
).toFixed(0);

interface FeatureListProps {
  children: React.ReactNode;
  className?: string;
}

const FeatureList = ({ children, className }: FeatureListProps) => (
  <ul className={`mb-6 space-y-2 ${className ?? ""}`}>{children}</ul>
);

function PricingTableContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(`bg-card flex flex-col rounded-lg border p-6`, className)}
    >
      {children}
    </div>
  );
}
function PricingTableHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-6">{children}</div>;
}
interface FeatureListItemProps {
  children: React.ReactNode;
}

const FeatureListItem = ({ children }: FeatureListItemProps) => (
  <li className="flex items-start">
    <Icon>
      <CheckIcon className="text-primary mr-2 mt-0.5 h-4 w-4 shrink-0" />
    </Icon>
    <span className="text-sm">{children}</span>
  </li>
);

function PeriodTabs({ period, onPeriodChange }: PricingTableProps) {
  return (
    <fieldset aria-label="Payment frequency">
      <RadioGroup
        value={period}
        onValueChange={onPeriodChange}
        className="grid grid-cols-2 gap-x-1 rounded-full p-1 text-center text-xs/5 font-semibold ring-1 ring-inset ring-gray-200"
      >
        <RadioGroupItem
          value="monthly"
          className="cursor-pointer rounded-full px-2.5 py-1 text-gray-500 data-[state=checked]:bg-indigo-600 data-[state=checked]:text-white"
        >
          <Trans i18nKey="monthlyBilling" defaults="Monthly" />
        </RadioGroupItem>
        <RadioGroupItem
          value="yearly"
          className="cursor-pointer rounded-full px-2.5 py-1 text-gray-500 data-[state=checked]:bg-indigo-600 data-[state=checked]:text-white"
        >
          <Trans i18nKey="yearlyBilling" defaults="Yearly" />
        </RadioGroupItem>
      </RadioGroup>
    </fieldset>
  );
}

export function PricingTable() {
  const [period, setPeriod] = React.useState<PricingPeriod>("yearly");
  return (
    <div className="w-full">
      <div className="mb-8 flex justify-center">
        <PeriodTabs period={period} onPeriodChange={setPeriod} />
      </div>

      <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
        {/* Hobby Plan */}
        <PricingTableContainer>
          <PricingTableHeader>
            <h2 className="text-xl font-bold">
              <Trans i18nKey="planHobby" defaults="Hobby" />
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              <Trans
                i18nKey="planHobbyDescription"
                defaults="For casual users"
              />
            </p>
            <div className="mt-4">
              <span className="text-3xl font-bold">$0</span>
              <span className="text-muted-foreground ml-1 text-sm">
                <Trans i18nKey="forever" defaults="forever" />
              </span>
            </div>
          </PricingTableHeader>

          <FeatureList>
            <FeatureListItem>
              <Trans i18nKey="featureCreatePolls" defaults="Create polls" />
            </FeatureListItem>
            <FeatureListItem>
              <Trans i18nKey="featureCollectVotes" defaults="Collect votes" />
            </FeatureListItem>
            <FeatureListItem>
              <Trans
                i18nKey="featureBasicPollSettings"
                defaults="Basic poll settings"
              />
            </FeatureListItem>
          </FeatureList>

          <div className="mt-auto">
            <Button variant="secondary" className="w-full" disabled>
              <Trans i18nKey="currentPlan" defaults="Current Plan" />
            </Button>
          </div>
        </PricingTableContainer>

        {/* Pro Plan */}
        <PricingTableContainer className="relative">
          <div className="absolute -top-4 left-4">
            <Badge>
              <Trans i18nKey="recommended" defaults="Recommended" />
            </Badge>
          </div>

          <PricingTableHeader>
            <h2 className="text-xl font-bold">
              <Trans i18nKey="planPro" defaults="Pro" />
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              <Trans
                i18nKey="planProDescription"
                defaults="For power users and profressionals"
              />
            </p>
            <div className="mt-4 flex items-baseline">
              <span className="text-3xl font-bold">
                ${period === "monthly" ? monthlyPrice : monthlyPriceAnnualRate}
              </span>
              <span className="text-muted-foreground ml-1 text-sm">
                <Trans i18nKey="perMonth" defaults="/mo" />
              </span>
            </div>
            {period === "yearly" && (
              <div className="text-muted-foreground mt-1 text-sm">
                <Trans
                  i18nKey="billedAnnually"
                  defaults="Billed annually (${yearlyPrice})"
                  values={{ yearlyPrice }}
                />
              </div>
            )}
          </PricingTableHeader>

          <FeatureList>
            <FeatureListItem>
              <Trans
                i18nKey="featureEverythingInHobby"
                defaults="Everything in Hobby"
              />
            </FeatureListItem>
            <FeatureListItem>
              <Trans i18nKey="featureNameFinalize" defaults="Finalize Poll" />
            </FeatureListItem>
            <FeatureListItem>
              <Trans i18nKey="featureNameDuplicate" defaults="Duplicate Poll" />
            </FeatureListItem>
            <FeatureListItem>
              <Trans
                i18nKey="featureNameAdvancedSettings"
                defaults="Advanced Settings"
              />
            </FeatureListItem>
            <FeatureListItem>
              <Trans
                i18nKey="featureNameExtendedPollLifetime"
                defaults="Extended Poll Lifetime"
              />
            </FeatureListItem>
          </FeatureList>

          <div className="mt-auto">
            <UpgradeButton annual={period === "yearly"} className="w-full">
              <Trans i18nKey="subscribe" defaults="Subscribe" />
            </UpgradeButton>
          </div>
        </PricingTableContainer>
      </div>
    </div>
  );
}
