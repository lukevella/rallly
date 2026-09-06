"use client";

import NumberFlow from "@number-flow/react";
import type { PricesByCurrency } from "@rallly/billing";
import { cn } from "@rallly/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rallly/ui/select";
import { Switch } from "@rallly/ui/switch";
import React from "react";
import { readCurrencyCookie } from "@/lib/currency";

type BillingInterval = "monthly" | "yearly";

const PricingContext = React.createContext<{
  interval: BillingInterval;
  setInterval: (interval: BillingInterval) => void;
  currency: string;
  setCurrency: (currency: string) => void;
  prices: PricesByCurrency;
  locale: string;
} | null>(null);

function usePricing() {
  const context = React.useContext(PricingContext);
  if (!context) {
    throw new Error("usePricing must be used within PricingProvider");
  }
  return context;
}

export function PricingProvider({
  prices,
  defaultCurrency,
  locale,
  children,
}: {
  prices: PricesByCurrency;
  defaultCurrency: string;
  locale: string;
  children: React.ReactNode;
}) {
  const [interval, setInterval] = React.useState<BillingInterval>("yearly");
  const [selectedCurrency, setCurrency] = React.useState(defaultCurrency);
  const currency = Object.hasOwn(prices, selectedCurrency)
    ? selectedCurrency
    : defaultCurrency;

  // The page is served from cache in the default currency; the proxy stamps
  // the detected one in a cookie, applied here after hydration.
  React.useEffect(() => {
    const detected = readCurrencyCookie();
    // Own key only: the cookie is visitor controlled.
    if (detected && Object.hasOwn(prices, detected)) {
      setCurrency(detected);
    }
  }, [prices]);
  const value = React.useMemo(
    () => ({ interval, setInterval, currency, setCurrency, prices, locale }),
    [interval, currency, prices, locale],
  );
  return (
    <PricingContext.Provider value={value}>{children}</PricingContext.Provider>
  );
}

function currencyLabel(currency: string, locale: string) {
  const code = currency.toUpperCase();
  const symbol = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    currencyDisplay: "narrowSymbol",
  })
    .formatToParts(0)
    .find((part) => part.type === "currency")?.value;
  return symbol && symbol !== code ? `${symbol} ${code}` : code;
}

export function CurrencySelect({ label }: { label: string }) {
  const { currency, setCurrency, prices, locale } = usePricing();
  const currencies = Object.keys(prices);
  if (currencies.length < 2) {
    return null;
  }
  return (
    <Select
      value={currency}
      onValueChange={(value) => {
        if (value) {
          setCurrency(value);
        }
      }}
    >
      <SelectTrigger
        aria-label={label}
        className="-ml-2 bg-transparent px-2 shadow-none ring-0 hover:bg-gray-200/60"
      >
        <SelectValue>{currencyLabel(currency, locale)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {currencies.map((code) => (
          <SelectItem key={code} value={code}>
            {currencyLabel(code, locale)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function BillingIntervalSwitch({
  monthlyLabel,
  yearlyLabel,
  switchLabel,
  badge,
}: {
  monthlyLabel: React.ReactNode;
  yearlyLabel: React.ReactNode;
  switchLabel: string;
  badge?: React.ReactNode;
}) {
  const { interval, setInterval } = usePricing();
  const isYearly = interval === "yearly";
  return (
    <div className="flex items-center gap-x-3">
      <button
        type="button"
        aria-pressed={!isYearly}
        onClick={() => setInterval("monthly")}
        className={cn(
          "cursor-pointer whitespace-nowrap rounded-sm font-medium text-sm transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
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
      <div className="flex items-center gap-x-2">
        <button
          type="button"
          aria-pressed={isYearly}
          onClick={() => setInterval("yearly")}
          className={cn(
            "cursor-pointer whitespace-nowrap rounded-sm font-medium text-sm transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            isYearly ? "text-gray-800" : "text-gray-500",
          )}
        >
          {yearlyLabel}
        </button>
        {badge}
      </div>
    </div>
  );
}

export function PricingControls({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
      {children}
    </div>
  );
}

export function PricingControlsDivider() {
  // Hidden when the currency select renders nothing and the divider becomes the first child.
  return (
    <div
      aria-hidden="true"
      className="hidden h-5 w-px bg-gray-200 first:hidden sm:block"
    />
  );
}

export function YearlySavingsBadge({
  labels,
}: {
  labels: Record<string, React.ReactNode>;
}) {
  const { currency } = usePricing();
  return labels[currency] ?? null;
}

export function PlanPrice() {
  const { interval, currency, prices, locale } = usePricing();
  const amounts = prices[currency];
  if (!amounts) {
    return null;
  }
  const value =
    interval === "yearly" ? amounts.yearly / 12 / 100 : amounts.monthly / 100;
  return (
    <NumberFlow
      value={value}
      locales={locale}
      format={{
        style: "currency",
        currency: currency.toUpperCase(),
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
  const { interval } = usePricing();
  return interval === "yearly" ? yearly : monthly;
}
