"use client";

import { cn } from "@rallly/ui";
import { Switch } from "@rallly/ui/switch";
import React from "react";

type BillingInterval = "monthly" | "yearly";

const BillingIntervalContext = React.createContext<{
  interval: BillingInterval;
  setInterval: (interval: BillingInterval) => void;
} | null>(null);

function useBillingInterval() {
  const context = React.useContext(BillingIntervalContext);
  if (!context) {
    throw new Error(
      "useBillingInterval must be used within BillingIntervalProvider",
    );
  }
  return context;
}

export function BillingIntervalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [interval, setInterval] = React.useState<BillingInterval>("yearly");
  const value = React.useMemo(() => ({ interval, setInterval }), [interval]);
  return (
    <BillingIntervalContext.Provider value={value}>
      {children}
    </BillingIntervalContext.Provider>
  );
}

export function BillingIntervalSwitch({
  monthlyLabel,
  yearlyLabel,
  badge,
  switchLabel,
}: {
  monthlyLabel: React.ReactNode;
  yearlyLabel: React.ReactNode;
  badge?: React.ReactNode;
  switchLabel: string;
}) {
  const { interval, setInterval } = useBillingInterval();
  const isYearly = interval === "yearly";
  return (
    <div className="flex items-center gap-x-3">
      <span
        className={cn(
          "font-medium text-sm",
          isYearly ? "text-gray-500" : "text-gray-800",
        )}
      >
        {monthlyLabel}
      </span>
      <Switch
        aria-label={switchLabel}
        checked={isYearly}
        onCheckedChange={(checked) =>
          setInterval(checked ? "yearly" : "monthly")
        }
      />
      <span
        className={cn(
          "font-medium text-sm",
          isYearly ? "text-gray-800" : "text-gray-500",
        )}
      >
        {yearlyLabel}
      </span>
      {badge}
    </div>
  );
}

export function BillingIntervalValue({
  monthly,
  yearly,
}: {
  monthly: React.ReactNode;
  yearly: React.ReactNode;
}) {
  const { interval } = useBillingInterval();
  return interval === "yearly" ? yearly : monthly;
}
