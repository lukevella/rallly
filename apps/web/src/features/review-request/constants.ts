import { isSelfHosted } from "@/lib/constants";

// Review sites list the Rallly cloud product; self-hosted users are asked
// through the README and the license email instead
export const isReviewRequestEnabled = !isSelfHosted;

// The email is a personal note from the founder, so it comes from a person
// who reads the replies rather than the no-reply address
export const reviewRequestSender = {
  name: "Luke from Rallly",
  address: "luke@rallly.co",
};

// Long enough that the email reads as a note rather than a receipt for the
// finalize click, short enough that the booking is still fresh
export const reviewRequestEmailDelayMs = 60 * 60_000;

// Consumers review on Trustpilot, business users on G2. G2 owns Capterra and
// shows G2 reviews there, so one G2 review covers both
export const reviewSites = {
  trustpilot: {
    name: "Trustpilot",
    url: "https://www.trustpilot.com/evaluate/rallly.co",
  },
  g2: {
    name: "G2",
    // G2's vendor review link, so reviews are attributed to our invitation
    url: "https://www.g2.com/contributor/cloud-2e719343-1982-403e-8985-699b7a393863",
    // Recipients complained the review form asks too much; the voice and chat
    // options on the same page are much quicker
    offersChatReview: true,
  },
} as const;

export type ReviewSite = keyof typeof reviewSites;

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
