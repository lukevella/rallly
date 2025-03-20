"use client";

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
  <ul className={`mb-6 space-y-3 ${className ?? ""}`}>{children}</ul>
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

export function PricingTable({ period, onPeriodChange }: PricingTableProps) {
  return (
    <div className="w-full">
      <div className="mb-6 flex justify-center">
        <div className="bg-muted inline-flex rounded-lg p-1">
          <Button
            variant={period === "monthly" ? "default" : "ghost"}
            size="sm"
            onClick={() => onPeriodChange("monthly")}
          >
            <Trans i18nKey="monthlyBilling" defaults="Monthly" />
          </Button>
          <Button
            variant={period === "yearly" ? "default" : "ghost"}
            size="sm"
            onClick={() => onPeriodChange("yearly")}
          >
            <Trans i18nKey="yearlyBilling" defaults="Yearly" />
            <Badge variant="green" className="ml-2">
              <Trans
                i18nKey="savePercentage"
                defaults="Save {percentage}%"
                values={{ percentage: annualSavingsPercentage }}
              />
            </Badge>
          </Button>
        </div>
      </div>

      <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
        {/* Hobby Plan */}
        <PricingTableContainer>
          <PricingTableHeader>
            <Badge variant="outline" className="mx-auto">
              <Trans i18nKey="planHobby" defaults="Hobby" />
            </Badge>
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
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <Badge>
              <Trans i18nKey="recommended" defaults="Recommended" />
            </Badge>
          </div>

          <PricingTableHeader>
            <Badge variant="primary">
              <Trans i18nKey="planPro" defaults="Pro" />
            </Badge>
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
