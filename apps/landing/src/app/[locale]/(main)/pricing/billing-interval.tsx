"use client";

import NumberFlow from "@number-flow/react";
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
    <div className="flex flex-col items-center gap-y-4">
      {badge ? (
        <div className="relative">
          {badge}
          <svg
            aria-hidden="true"
            viewBox="0 0 48 32"
            className="pointer-events-none absolute top-0 -right-16 h-9 w-16 text-gray-400"
            fill="none"
          >
            <path
              d="M2 7c17-6 31 1 30 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M26 18l6 5 4-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : null}
      <div className="flex items-center gap-x-3">
        <button
          type="button"
          aria-pressed={!isYearly}
          onClick={() => setInterval("monthly")}
          className={cn(
            "cursor-pointer rounded-sm font-medium text-sm transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            isYearly ? "text-gray-500" : "text-gray-800",
          )}
        >
          {monthlyLabel}
        </button>
        <Switch
          aria-label={switchLabel}
          checked={isYearly}
          onCheckedChange={(checked) =>
            setInterval(checked ? "yearly" : "monthly")
          }
        />
        <button
          type="button"
          aria-pressed={isYearly}
          onClick={() => setInterval("yearly")}
          className={cn(
            "cursor-pointer rounded-sm font-medium text-sm transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            isYearly ? "text-gray-800" : "text-gray-500",
          )}
        >
          {yearlyLabel}
        </button>
      </div>
    </div>
  );
}

export function BillingIntervalPrice({
  monthly,
  yearly,
}: {
  monthly: number;
  yearly: number;
}) {
  const { interval } = useBillingInterval();
  return (
    <NumberFlow
      value={interval === "yearly" ? yearly : monthly}
      locales="en-US"
      format={{
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }}
    />
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
