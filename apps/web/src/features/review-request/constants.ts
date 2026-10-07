import { isSelfHosted } from "@/lib/constants";

// Review sites list the Rallly cloud product; self-hosted users are asked
// through the README and the license email instead
export const isReviewRequestEnabled = !isSelfHosted;

// Consumers review on Trustpilot; business users on one B2B site at a time,
// because splitting a few reviews a week across sites leaves each too thin for
// its badges. REVIEW_REQUEST_BUSINESS_SITE picks the B2B site.
export const reviewSites = {
  trustpilot: {
    name: "Trustpilot",
    url: "https://www.trustpilot.com/evaluate/rallly.co",
  },
  capterra: {
    name: "Capterra",
    url: "https://reviews.capterra.com/products/new/98997d01-ab0a-4292-9842-5b34c9411138/?utm_source=vp&utm_campaign=vendor_request",
  },
  g2: {
    name: "G2",
    url: "https://www.g2.com/products/rallly/review_modalities/new?utm_source=rallly&utm_medium=in-app&utm_campaign=review-request",
  },
} as const;

export type ReviewSite = keyof typeof reviewSites;

export const businessReviewSites = ["capterra", "g2"] as const;

export type BusinessReviewSite = (typeof businessReviewSites)[number];

/**
 * Free mail providers. An address on one of these is treated as a consumer.
 * Deliberately not exhaustive: a miss sends a consumer to the business review
 * site, which costs nothing worse than a less fitting ask.
 */
export const consumerEmailDomains: ReadonlySet<string> = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "hotmail.co.uk",
  "hotmail.fr",
  "live.com",
  "live.co.uk",
  "msn.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.fr",
  "yahoo.de",
  "ymail.com",
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
  "t-online.de",
  "mail.com",
  "zoho.com",
  "yandex.com",
  "yandex.ru",
  "mail.ru",
  "orange.fr",
  "free.fr",
  "laposte.net",
  "libero.it",
  "btinternet.com",
  "comcast.net",
  "qq.com",
  "163.com",
  "naver.com",
  "fastmail.com",
  "hey.com",
  "tutanota.com",
]);
