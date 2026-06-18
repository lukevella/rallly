"use client";

import { usePayWallStore } from "../paywall-store";
import { PayWallDialog } from "./pay-wall-dialog";

/**
 * Single, app-wide paywall instance.
 * Open it from anywhere with `showPayWall()`.
 */
export function PayWall() {
  const isOpen = usePayWallStore((state) => state.isOpen);
  const hide = usePayWallStore((state) => state.hide);

  return (
    <PayWallDialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          hide();
        }
      }}
    />
  );
}
