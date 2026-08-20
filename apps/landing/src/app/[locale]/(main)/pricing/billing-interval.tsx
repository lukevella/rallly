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
    <div className="flex flex-col items-center gap-y-2">
      {badge ? (
        <div className="relative">
          {badge}
          <svg
            aria-hidden="true"
            viewBox="0 0 48 40"
            className="pointer-events-none absolute top-0 -right-16 hidden h-12 w-16 text-green-500 sm:block"
            fill="none"
          >
            <path
              d="M2 8c18-7 33 2 32 20"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M27 22l7 7 5-6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : null}
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
