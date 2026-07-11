"use client";

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

type PayWallStore = {
  isOpen: boolean;
  show: () => void;
  hide: () => void;
};

export const usePayWallStore = create<PayWallStore>((set) => ({
  isOpen: false,
  show: () => set({ isOpen: true }),
  hide: () => set({ isOpen: false }),
}));

export const showPayWall = () => usePayWallStore.getState().show();
