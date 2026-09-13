import type { AssetProfile } from "@/lib/storage/asset-profile";

export const NONPROFIT_DISCOUNT_PERCENT = 20;

// Stripe coupon id; derived so the id and the percentage cannot drift.
export const NONPROFIT_COUPON_ID = `nonprofit-${NONPROFIT_DISCOUNT_PERCENT}`;

/**
 * Verification documents are read once by the reviewer and deleted after
 * the decision; the storage GET route refuses this profile so a key can
 * never be fetched, whatever the retention window.
 */
export const nonprofitDocumentAssetProfile = {
  id: "nonprofit-document",
  keyPrefix: "nonprofit-documents",
  accept: ["application/pdf", "image/jpeg", "image/png"],
  maxSize: 10 * 1024 * 1024,
} as const satisfies AssetProfile;

export const MAX_DOCUMENTS = 3;
