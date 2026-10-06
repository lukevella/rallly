import "server-only";

import { prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import { env } from "@/env";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { track } from "@/lib/posthog";
import { countFinalizedPolls } from "./data";
import { isEligibleForReviewRequest, pickReviewSite } from "./utils";

const logger = createLogger("review-request");

/**
 * Decides whether to ask the user for a review right after they finalize a
 * poll, and records the ask so it is shown once per user. Returns the site to
 * ask for, or null when the caller should not ask. Never throws: it runs after
 * the poll is already finalized, so a failure here must not fail the finalize
 * request.
 */
export async function claimReviewRequest(params: {
  userId: string;
  email: string;
  participantCount: number;
}) {
  try {
    return await claimReviewRequestOrThrow(params);
  } catch (error) {
    logger.error({ error, userId: params.userId }, "Review request failed");
    return null;
  }
}

async function claimReviewRequestOrThrow({
  userId,
  email,
  participantCount,
}: {
  userId: string;
  email: string;
  participantCount: number;
}) {
  if (!isFeatureEnabled("reviewRequests")) {
    return null;
  }

  const finalizedPollCount = await countFinalizedPolls(userId);

  if (!isEligibleForReviewRequest({ finalizedPollCount, participantCount })) {
    return null;
  }

  // Conditional on the column being unset, so two finalizations racing each
  // other still ask only once.
  const { count } = await prisma.user.updateMany({
    where: { id: userId, reviewRequestedAt: null },
    data: { reviewRequestedAt: new Date() },
  });

  if (count === 0) {
    return null;
  }

  const site = pickReviewSite({
    email,
    businessSite: env.REVIEW_REQUEST_BUSINESS_SITE,
  });

  track(
    { id: userId, isGuest: false },
    {
      event: "review_request:prompt_view",
      properties: {
        channel: "in_app",
        destination: site,
        finalized_poll_count: finalizedPollCount,
        participant_count: participantCount,
      },
    },
  );

  return site;
}
