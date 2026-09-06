"use client";

import type { PricesByCurrency } from "@rallly/billing";
import { posthog } from "@rallly/posthog/client";
import React from "react";
import { create } from "zustand";
import type { SpaceTier } from "@/features/space/schema";

const TierContext = React.createContext<SpaceTier | null>(null);

export function TierProvider({
  tier,
  children,
}: {
  tier: SpaceTier;
  children: React.ReactNode;
}) {
  return <TierContext.Provider value={tier}>{children}</TierContext.Provider>;
}

export function useTier(): SpaceTier {
  const tier = React.useContext(TierContext);

  if (tier === null) {
    throw new Error("useTier must be used within a TierProvider");
  }

  return tier;
}

export function useIsFree() {
  return useTier() === "hobby";
}

export type PayWallTrigger = {
  from:
    | "poll-settings"
    | "manage-poll"
    | "custom-branding"
    | "api-keys"
    | "space-members"
    | "space-collaboration"
    | "billing-settings"
    | "sidebar"
    | "invite-dialog";
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

const PayWallPricingContext = React.createContext<PayWallPricing | null>(null);

/**
 * Stripe prices for the pay wall and the currency to show first. Null means
 * the layout could not load them; the dialog then shows the built in USD
 * prices, so a Stripe outage degrades the copy rather than the upgrade path.
 */
export function PayWallPricingProvider({
  pricing,
  children,
}: {
  pricing: PayWallPricing | null;
  children: React.ReactNode;
}) {
  return (
    <PayWallPricingContext.Provider value={pricing}>
      {children}
    </PayWallPricingContext.Provider>
  );
}

export function usePayWallPricing() {
  return React.useContext(PayWallPricingContext);
}
