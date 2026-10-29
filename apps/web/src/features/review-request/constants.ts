import { isSelfHosted } from "@/lib/constants";

// Review sites list the Rallly cloud product; self-hosted users are asked
// through the README and the license email instead
export const isReviewRequestEnabled = !isSelfHosted;

// Long enough that the email reads as a note rather than a receipt for the
// finalize click, short enough that the booking is still fresh
export const reviewRequestEmailDelayMs = 60 * 60_000;

// Consumers review on Trustpilot; business users are split evenly across the
// B2B sites
export const reviewSites = {
  trustpilot: {
    name: "Trustpilot",
    url: "https://www.trustpilot.com/evaluate/rallly.co",
  },
  capterra: {
    name: "Capterra",
    // Capterra's vendor terms require this exact URL, UTM parameters
    // included, and telling reviewers to follow its community guidelines
    url: "https://reviews.capterra.com/products/new/98997d01-ab0a-4292-9842-5b34c9411138/?utm_source=vp&utm_campaign=vendor_request",
    guidelinesUrl: "https://www.capterra.com/legal/community-guidelines/",
  },
  g2: {
    name: "G2",
    // G2's vendor review link, so reviews are attributed to our invitation
    url: "https://www.g2.com/contributor/cloud-2e719343-1982-403e-8985-699b7a393863",
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
