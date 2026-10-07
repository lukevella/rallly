import type { BusinessReviewSite } from "./constants";
import { consumerEmailDomains } from "./constants";

// One finalized poll can be a fluke; a second one means Rallly worked for them
const minFinalizedPolls = 2;
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
 * Consumers are pointed to Trustpilot, everyone else to the business review
 * site, judged by whether the address is on a free mail provider.
 */
export function pickReviewSite({
  email,
  businessSite,
}: {
  email: string;
  businessSite: BusinessReviewSite;
}) {
  const domain = email.trim().toLowerCase().split("@").pop();
  return domain && consumerEmailDomains.has(domain)
    ? ("trustpilot" as const)
    : businessSite;
}

/**
 * The first word of the account name, for a "Hi {name}" greeting. Empty when
 * the name looks like an email address, which is what some sign-ups store.
 */
export function getFirstName(name: string) {
  const first = name.trim().split(/\s+/)[0] ?? "";
  return first.includes("@") ? "" : first;
}
