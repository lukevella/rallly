"use client";

import { usePayWallStore } from "../client";
import { PayWallDialog } from "./pay-wall-dialog";

/**
 * Single, app-wide paywall instance.
 * Open it from anywhere with `showPayWall()`.
 *
 * Branding props personalize the custom branding preview; they're optional
 * because the dialog is also mounted on routes without an active space
 * (guests via quick create).
 */
export function PayWall({
  spaceName,
  spaceImage,
  primaryColor,
}: {
  spaceName?: string;
  spaceImage?: string;
  primaryColor?: string;
}) {
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
      spaceName={spaceName}
      spaceImage={spaceImage}
      primaryColor={primaryColor}
    />
  );
}
