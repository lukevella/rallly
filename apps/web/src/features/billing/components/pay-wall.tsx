"use client";

import type { PayWallPricing } from "../client";
import { usePayWallStore } from "../client";
import { PayWallDialog } from "./pay-wall-dialog";

/**
 * Single, app-wide paywall instance.
 * Open it from anywhere with `showPayWall()`.
 */
export function PayWall({ pricing }: { pricing: PayWallPricing | null }) {
  const isOpen = usePayWallStore((state) => state.isOpen);
  const hide = usePayWallStore((state) => state.hide);

  return (
    <PayWallDialog
      pricing={pricing}
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          hide();
        }
      }}
    />
  );
}
