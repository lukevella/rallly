"use client";

import { posthog } from "@rallly/posthog/client";
import { create } from "zustand";
import type { SpaceTier } from "@/features/space/schema";
import { trpc } from "@/trpc/client";

export function useTier(): SpaceTier {
  const { data: tier } = trpc.billing.getTier.useQuery();

  return tier ?? "hobby";
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
    | "billing-settings"
    | "sidebar";
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
