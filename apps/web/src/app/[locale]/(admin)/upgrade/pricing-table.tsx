"use client";

import { RadioGroup, RadioGroupItem } from "@radix-ui/react-radio-group";
import { pricingData } from "@rallly/billing/pricing";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@rallly/ui/tooltip";
import {
  CalendarCheck2Icon,
  CheckIcon,
  CopyIcon,
  InfoIcon,
  PlusIcon,
  Settings2Icon,
  TimerIcon,
} from "lucide-react";
import React from "react";

import { Trans } from "@/components/trans";
import { UpgradeButton } from "@/components/upgrade-button";

export type PricingPeriod = "monthly" | "yearly";

interface PricingTableProps {
  period: PricingPeriod;
  onPeriodChange: (period: PricingPeriod) => void;
}

const monthlyPrice = (pricingData.monthly.amount / 100).toFixed(2);
const monthlyPriceAnnualRate = (pricingData.yearly.amount / 100 / 12).toFixed(
  2,
);

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
  icon?: React.ReactNode;
  tooltip?: React.ReactNode;
}

const FeatureListItem = ({ children, icon, tooltip }: FeatureListItemProps) => (
  <li className="flex items-center gap-2">
    <span className="text-primary">
      {icon ? icon : <CheckIcon className="size-4" />}
    </span>
    <span className="text-sm">{children}</span>
    {tooltip ? (
      <Tooltip>
        <TooltipTrigger className="inline-flex">
          <InfoIcon className="size-4 text-gray-400" />
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent className="max-w-xs">{tooltip}</TooltipContent>
        </TooltipPortal>
      </Tooltip>
    ) : null}
  </li>
);

function PeriodTabs({ period, onPeriodChange }: PricingTableProps) {
  return (
    <fieldset aria-label="Payment frequency">
      <RadioGroup
        value={period}
        onValueChange={onPeriodChange}
        className="grid grid-cols-2 gap-x-1 rounded-full p-1 text-center text-xs/5 font-medium ring-1 ring-inset ring-gray-200"
      >
        <RadioGroupItem
          value="monthly"
          className="data-[state=checked]:bg-primary-50 data-[state=checked]:text-primary cursor-pointer rounded-full px-2.5 py-1 text-gray-500"
        >
          <Trans i18nKey="monthlyBilling" defaults="Monthly" />
        </RadioGroupItem>
        <RadioGroupItem
          value="yearly"
          className="data-[state=checked]:bg-primary-50 data-[state=checked]:text-primary cursor-pointer rounded-full px-2.5 py-1 text-gray-500"
        >
          <Trans i18nKey="yearlyBilling" defaults="Yearly" />
        </RadioGroupItem>
      </RadioGroup>
    </fieldset>
  );
}

function ProPrice({ period }: { period: PricingPeriod }) {
  return (
    <div className="mt-4 flex items-baseline">
      <span className="text-3xl font-bold tabular-nums">
        ${period === "monthly" ? monthlyPrice : monthlyPriceAnnualRate}
      </span>
      <span className="text-muted-foreground ml-1 text-sm">
        <Trans i18nKey="perMonth" defaults="/mo" />
      </span>
    </div>
  );
}

function ProUpgradeButton({ period }: { period: PricingPeriod }) {
  return (
    <UpgradeButton annual={period === "yearly"} className="w-full">
      <Trans i18nKey="upgrade" defaults="Upgrade" />
    </UpgradeButton>
  );
}

function ProFeatureList() {
  return (
    <FeatureList>
      <FeatureListItem>
        <Trans
          i18nKey="featureEverythingInHobby"
          defaults="Everything in Hobby"
        />
      </FeatureListItem>
      <div className="py-2">
        <div className="mt-2 flex items-center justify-center border-t">
          <div className="-mt-2 bg-white px-2.5">
            <PlusIcon className="size-4 text-gray-400" />
          </div>
        </div>
      </div>
      <FeatureListItem
        tooltip={
          <Trans
            i18nKey="featureFinalizePollDescription"
            defaults="Lock your poll and notify participants when you've made your final decision."
          />
        }
        icon={<CalendarCheck2Icon className="size-4" />}
      >
        <Trans i18nKey="featureNameFinalizePoll" defaults="Finalize" />
      </FeatureListItem>
      <FeatureListItem
        tooltip={
          <Trans
            i18nKey="featureDuplicatePollDescription"
            defaults="Create a copy of an existing poll to save time when creating similar events."
          />
        }
        icon={<CopyIcon className="size-4" />}
      >
        <Trans i18nKey="featureNameDuplicatePoll" defaults="Duplicate" />
      </FeatureListItem>
      <FeatureListItem
        tooltip={
          <Trans
            i18nKey="featureAdvancedPollSettingsDescription"
            defaults="Access additional options like requiring email addresses and hiding participants."
          />
        }
        icon={<Settings2Icon className="size-4" />}
      >
        <Trans
          i18nKey="featureNameAdvancedPollSettings"
          defaults="Advanced settings"
        />
      </FeatureListItem>
      <FeatureListItem
        tooltip={
          <Trans
            i18nKey="featureExtendedLifetimeDescription"
            defaults="Keep your polls active for longer periods without worrying about automatic deletion."
          />
        }
        icon={<TimerIcon className="size-4" />}
      >
        <Trans
          i18nKey="featureNameExtendedLifetime"
          defaults="Extended poll lifetime"
        />
      </FeatureListItem>
    </FeatureList>
  );
}

export function PricingTable() {
  const [period, setPeriod] = React.useState<PricingPeriod>("yearly");
  return (
    <div>
      <div className="mb-8 flex justify-center">
        <PeriodTabs period={period} onPeriodChange={setPeriod} />
      </div>
      <div className="">
        <ProPrice period={period} />
        <ProUpgradeButton period={period} />
        <ProFeatureList />
      </div>
    </div>
  );
}
