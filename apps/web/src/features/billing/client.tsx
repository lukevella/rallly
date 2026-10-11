"use client";

import type { PricesByCurrency } from "@rallly/billing";
import { CURRENCY_COOKIE_NAME, pricingData } from "@rallly/billing";
import { posthog } from "@rallly/posthog/client";
import Cookies from "js-cookie";
import React from "react";
import { create } from "zustand";
import { getTrialState } from "@/features/billing/trial/utils";
import { formatMinorUnitAmount } from "@/features/billing/utils";
import type { SpaceTier } from "@/features/space/schema";
import { useDateTimeConfig } from "@/lib/datetime/client";

type TierContextValue = {
  tier: SpaceTier;
  trialStartedAt: Date | null;
  trialEndsAt: Date | null;
  subscriptionActive: boolean;
  pricing: PayWallPricing | null;
};

const TierContext = React.createContext<TierContextValue | null>(null);

export function TierProvider({
  tier,
  trialStartedAt = null,
  trialEndsAt = null,
  subscriptionActive = false,
  pricing = null,
  children,
}: {
  tier: SpaceTier;
  trialStartedAt?: Date | null;
  trialEndsAt?: Date | null;
  subscriptionActive?: boolean;
  // The pay wall's prices by currency, with the currency to show first; null
  // without billing or when Stripe was unreachable.
  pricing?: PayWallPricing | null;
  children: React.ReactNode;
}) {
  const value = React.useMemo(
    () => ({ tier, trialStartedAt, trialEndsAt, subscriptionActive, pricing }),
    [tier, trialStartedAt, trialEndsAt, subscriptionActive, pricing],
  );

  return <TierContext.Provider value={value}>{children}</TierContext.Provider>;
}

function useTierContext() {
  const value = React.useContext(TierContext);

  if (value === null) {
    throw new Error("useTier must be used within a TierProvider");
  }

  return value;
}

export function useTier(): SpaceTier {
  return useTierContext().tier;
}

/**
 * The space's free trial dates, beside its tier. Both null until the trial
 * starts; kept after it ends, so a space with trialStartedAt has used it.
 * subscriptionActive says whether something is paying for the space, which
 * the tier alone cannot: a running trial is pro without a subscription.
 */
export function useTrial() {
  const { trialStartedAt, trialEndsAt, subscriptionActive } = useTierContext();
  return { trialStartedAt, trialEndsAt, subscriptionActive };
}

/**
 * The one answer every trial surface reads: eligible, trial, paying, ended
 * or none. See getTrialState for the rules.
 */
export function useTrialState() {
  return getTrialState(useTierContext());
}

/**
 * Pro's monthly price in the viewer's currency and number format ("$7",
 * "7 €"), from the same prices the pay wall shows: the currency the visitor
 * picked or was detected with, else the built-in list price. Copy such as
 * "{price} a month" never hard-types the amount.
 */
export function useProMonthlyPrice() {
  const { locale } = useDateTimeConfig();
  const { pricing } = useTierContext();
  const currency = pricing?.defaultCurrency ?? pricingData.monthly.currency;
  const amount =
    pricing?.prices[currency]?.monthly ?? pricingData.monthly.amount;
  return formatMinorUnitAmount({ amount, currency, locale });
}

export function useIsFree() {
  return useTier() === "hobby";
}

export type PayWallTrigger = {
  from:
    | "poll-settings"
    | "custom-branding"
    | "api-keys"
    | "space-members"
    | "space-collaboration"
    | "billing-settings"
    | "poll-footer";
  setting?: string;
  action?: string;
  pollId?: string;
};

type PayWallStore = {
  isOpen: boolean;
  trigger: PayWallTrigger | null;
  show: (trigger: PayWallTrigger) => void;
  hide: () => void;
};

export const usePayWallStore = create<PayWallStore>((set) => ({
  isOpen: false,
  trigger: null,
  show: (trigger) => {
    posthog?.capture("trigger paywall", {
      from: trigger.from,
      setting: trigger.setting,
      action: trigger.action,
      poll_id: trigger.pollId,
    });
    set({ isOpen: true, trigger });
  },
  hide: () => set({ isOpen: false }),
}));

export const showPayWall = (trigger: PayWallTrigger) =>
  usePayWallStore.getState().show(trigger);

export type PayWallPricing = {
  prices: PricesByCurrency;
  defaultCurrency: string;
};

// Same cookie the pricing page writes, so a currency picked in either place
// is what the other opens in. Shared across subdomains via the cookie domain.
export function setCurrencyCookie(currency: string) {
  Cookies.set(CURRENCY_COOKIE_NAME, currency, {
    path: "/",
    sameSite: "lax",
    domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
    expires: 365,
  });
}
