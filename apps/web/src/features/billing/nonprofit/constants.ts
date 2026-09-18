import type { AssetProfile } from "@/lib/storage/asset-profile";

export const NONPROFIT_DISCOUNT_PERCENT = 30;

// Stripe coupon id; derived so the id and the percentage cannot drift.
export const NONPROFIT_COUPON_ID = `nonprofit-${NONPROFIT_DISCOUNT_PERCENT}`;

export const NONPROFIT_VERIFIER_DEFAULT_MODEL = "gpt-5.6-terra";

export const NONPROFIT_SITE_TEXT_MAX_CHARS = 8_000;

// Consumer mailbox providers. Anyone can register these, so an address on one
// says nothing about the organization. No public suffix list: exact match only.
export const FREEMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "gmx.com",
  "gmx.de",
  "gmx.net",
  "web.de",
  "mail.com",
  "zoho.com",
  "zohomail.com",
  "yandex.com",
  "yandex.ru",
  "fastmail.com",
  "hey.com",
]);

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
