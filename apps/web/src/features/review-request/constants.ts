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

// Everyone is asked on Trustpilot. G2 was dropped: every route through its
// review flow takes several minutes and recipients complained about it
export const reviewSite = {
  name: "Trustpilot",
  url: "https://www.trustpilot.com/evaluate/rallly.co",
} as const;
