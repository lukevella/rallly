"use client";

import type { SpaceTier } from "@/features/space/schema";
import { trpc } from "@/trpc/client";

export function useTier(): SpaceTier {
  const { data: tier } = trpc.billing.getTier.useQuery();

  return tier ?? "hobby";
}

export function useIsFree() {
  return useTier() === "hobby";
}
