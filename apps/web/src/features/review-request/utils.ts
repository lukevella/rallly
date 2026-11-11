import type { ReviewSite } from "./constants";
import { consumerEmailDomains, reviewSites } from "./constants";

// A finalized poll with a group behind it means Rallly worked for them.
// Waiting for a second one asked a fifth as many people.
const minFinalizedPolls = 1;
// Filters out solo tests: the poll worked for a group
const minParticipants = 3;

export function isEligibleForReviewRequest({
  finalizedPollCount,
  participantCount,
}: {
  finalizedPollCount: number;
  participantCount: number;
}) {
  return (
    finalizedPollCount >= minFinalizedPolls &&
    participantCount >= minParticipants
  );
}

/**
 * Consumers are pointed to Trustpilot, judged by whether the address is on a
 * free mail provider. Everyone else is pointed to G2.
 */
export function pickReviewSite({ email }: { email: string }): ReviewSite {
  const domain = email.trim().toLowerCase().split("@").pop();
  if (domain && consumerEmailDomains.has(domain)) {
    return "trustpilot";
  }
  return "g2";
}

/**
 * The first word of the account name, for a "Hi {name}" greeting. Empty when
 * the name looks like an email address, which is what some sign-ups store.
 */
export function getFirstName(name: string) {
  const first = name.trim().split(/\s+/)[0] ?? "";
  return first.includes("@") ? "" : first;
}

/** Whether the site offers voice and chat reviews instead of a long form. */
export function offersChatReview(site: ReviewSite) {
  const config: { name: string; url: string; offersChatReview?: boolean } =
    reviewSites[site];
  return config.offersChatReview ?? false;
}
