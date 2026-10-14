import type { ReviewSite } from "./constants";
import {
  businessReviewSites,
  consumerEmailDomains,
  reviewSites,
} from "./constants";

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
 * free mail provider. Everyone else is split evenly across the business review
 * sites by user id, so a retried email points to the same site.
 */
export function pickReviewSite({
  userId,
  email,
}: {
  userId: string;
  email: string;
}): ReviewSite {
  const domain = email.trim().toLowerCase().split("@").pop();
  if (domain && consumerEmailDomains.has(domain)) {
    return "trustpilot";
  }
  return (
    businessReviewSites[hashString(userId) % businessReviewSites.length] ??
    businessReviewSites[0]
  );
}

// FNV-1a: stable across runtimes, spreads ids evenly
function hashString(value: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * The first word of the account name, for a "Hi {name}" greeting. Empty when
 * the name looks like an email address, which is what some sign-ups store.
 */
export function getFirstName(name: string) {
  const first = name.trim().split(/\s+/)[0] ?? "";
  return first.includes("@") ? "" : first;
}

/** The site's reviewer rules, for sites whose vendor terms require linking them. */
export function getReviewGuidelinesUrl(site: ReviewSite) {
  const config: { name: string; url: string; guidelinesUrl?: string } =
    reviewSites[site];
  return config.guidelinesUrl;
}
