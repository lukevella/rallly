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
 * The first word of the account name, for a "Hi {name}" greeting. Empty when
 * the name looks like an email address, which is what some sign-ups store.
 */
export function getFirstName(name: string) {
  const first = name.trim().split(/\s+/)[0] ?? "";
  return first.includes("@") ? "" : first;
}
