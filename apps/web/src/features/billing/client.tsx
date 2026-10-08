"use client";

import type { PricesByCurrency } from "@rallly/billing";
import { CURRENCY_COOKIE_NAME } from "@rallly/billing";
import { posthog } from "@rallly/posthog/client";
import Cookies from "js-cookie";
import React from "react";
import { create } from "zustand";
import type { SpaceTier } from "@/features/space/schema";

type TierContextValue = {
  tier: SpaceTier;
  trialStartedAt: Date | null;
  trialEndsAt: Date | null;
};

const TierContext = React.createContext<TierContextValue | null>(null);

export function TierProvider({
  tier,
  trialStartedAt = null,
  trialEndsAt = null,
  children,
}: {
  tier: SpaceTier;
  trialStartedAt?: Date | null;
  trialEndsAt?: Date | null;
  children: React.ReactNode;
}) {
  const value = React.useMemo(
    () => ({ tier, trialStartedAt, trialEndsAt }),
    [tier, trialStartedAt, trialEndsAt],
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
 */
export function useTrial() {
  const { trialStartedAt, trialEndsAt } = useTierContext();
  return { trialStartedAt, trialEndsAt };
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
    | "invite-dialog"
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
