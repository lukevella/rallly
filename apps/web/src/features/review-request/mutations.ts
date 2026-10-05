import "server-only";

import { prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { track } from "@/lib/posthog";
import { countFinalizedPolls } from "./data";
import { isEligibleForReviewRequest } from "./utils";

const logger = createLogger("review-request");

/**
 * Decides whether to ask the user for a review right after they finalize a
 * poll, and records the ask so it is shown once per user. Returns true when
 * the caller should show the ask. Never throws: it runs after the poll is
 * already finalized, so a failure here must not fail the finalize request.
 */
export async function claimReviewRequest(params: {
  userId: string;
  participantCount: number;
}) {
  try {
    return await claimReviewRequestOrThrow(params);
  } catch (error) {
    logger.error({ error, userId: params.userId }, "Review request failed");
    return false;
  }
}

async function claimReviewRequestOrThrow({
  userId,
  participantCount,
}: {
  userId: string;
  participantCount: number;
}) {
  if (!isFeatureEnabled("reviewRequests")) {
    return false;
  }

  const finalizedPollCount = await countFinalizedPolls(userId);

  if (!isEligibleForReviewRequest({ finalizedPollCount, participantCount })) {
    return false;
  }

  // Conditional on the column being unset, so two finalizations racing each
  // other still ask only once.
  const { count } = await prisma.user.updateMany({
    where: { id: userId, reviewRequestedAt: null },
    data: { reviewRequestedAt: new Date() },
  });

  if (count === 0) {
    return false;
  }

  track(
    { id: userId, isGuest: false },
    {
      event: "review_request:prompt_view",
      properties: {
        channel: "in_app",
        destination: "g2",
        finalized_poll_count: finalizedPollCount,
        participant_count: participantCount,
      },
    },
  );

  return true;
}
