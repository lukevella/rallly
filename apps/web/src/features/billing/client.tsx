"use client";

import type { PricesByCurrency } from "@rallly/billing";
import { CURRENCY_COOKIE_NAME } from "@rallly/billing/pricing";
import { posthog } from "@rallly/posthog/client";
import Cookies from "js-cookie";
import React from "react";
import { create } from "zustand";
import type { SpaceTier } from "@/features/space/schema";

const TierContext = React.createContext<SpaceTier | null>(null);

/**
 * A null tier inherits the enclosing provider's, so a nested provider can
 * override the tier only when it has one of its own.
 */
export function TierProvider({
  tier,
  children,
}: {
  tier: SpaceTier | null;
  children: React.ReactNode;
}) {
  const inherited = React.useContext(TierContext);
  return (
    <TierContext.Provider value={tier ?? inherited}>
      {children}
    </TierContext.Provider>
  );
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
    | "poll-details-form"
    | "manage-poll"
    | "custom-branding"
    | "api-keys"
    | "webhooks"
    | "space-members"
    | "space-collaboration"
    | "billing-settings"
    | "sidebar"
    | "invite-dialog"
    | "finalize-dialog"
    | "poll-footer";
  setting?: string;
  action?: string;
  pollId?: string;
};

export type PayWallPricing = {
  prices: PricesByCurrency;
  defaultCurrency: string;
};

type PayWallStore = {
  isOpen: boolean;
  trigger: PayWallTrigger | null;
  /** Loaded once by the app-wide instance; nested instances read it here. */
  pricing: PayWallPricing | null;
  /** Records the trigger without opening the app-wide dialog, for a pay
   * wall a dialog nests inside itself. */
  prime: (trigger: PayWallTrigger) => void;
  show: (trigger: PayWallTrigger) => void;
  hide: () => void;
};

export const usePayWallStore = create<PayWallStore>((set, get) => ({
  isOpen: false,
  trigger: null,
  pricing: null,
  prime: (trigger) => {
    posthog?.capture("trigger paywall", {
      from: trigger.from,
      setting: trigger.setting,
      action: trigger.action,
      poll_id: trigger.pollId,
    });
    set({ trigger });
  },
  show: (trigger) => {
    get().prime(trigger);
    set({ isOpen: true });
  },
  hide: () => set({ isOpen: false }),
}));

export const showPayWall = (trigger: PayWallTrigger) =>
  usePayWallStore.getState().show(trigger);

export const primePayWall = (trigger: PayWallTrigger) =>
  usePayWallStore.getState().prime(trigger);

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
