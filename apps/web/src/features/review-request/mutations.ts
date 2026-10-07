import "server-only";

import { prisma } from "@rallly/database";
import { sendReviewRequestEmail } from "@rallly/emails/templates/review-request";
import { createLogger } from "@rallly/logger";
import { Effect } from "effect";
import { getInstanceBranding } from "@/emails/branding";
import { env } from "@/env";
import { queueEmails } from "@/features/email-queue/mutations";
import {
  QueuedEmailFailed,
  QueuedEmailSkipped,
} from "@/features/email-queue/service";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { track } from "@/lib/posthog";
import { reviewRequestEmailDelayMs, reviewSites } from "./constants";
import { countFinalizedPolls, getReviewRequestRecipient } from "./data";
import {
  getFirstName,
  getReviewGuidelinesUrl,
  isEligibleForReviewRequest,
  pickReviewSite,
} from "./utils";

const logger = createLogger("review-request");

/**
 * Decides whether the user should be asked for a review after finalizing a
 * poll, and if so queues the email and records the ask so it is sent once per
 * user. Never throws: it runs after the poll is already finalized, so a
 * failure here must not fail the finalize request.
 */
export async function queueReviewRequest(params: {
  userId: string;
  participantCount: number;
}) {
  try {
    await queueReviewRequestOrThrow(params);
  } catch (error) {
    logger.error({ error, userId: params.userId }, "Review request failed");
  }
}

async function queueReviewRequestOrThrow({
  userId,
  participantCount,
}: {
  userId: string;
  participantCount: number;
}) {
  if (!isFeatureEnabled("reviewRequests")) {
    return;
  }

  const finalizedPollCount = await countFinalizedPolls(userId);

  if (!isEligibleForReviewRequest({ finalizedPollCount, participantCount })) {
    return;
  }

  const queued = await prisma.$transaction(async (tx) => {
    // Conditional on the column being unset, so two finalizations racing
    // each other still ask only once.
    const { count } = await tx.user.updateMany({
      where: { id: userId, reviewRequestedAt: null },
      data: { reviewRequestedAt: new Date() },
    });
    if (count === 0) {
      return false;
    }
    await queueEmails(tx, {
      kind: "review_request",
      userId,
      batchId: userId,
      subjectIds: [userId],
      sendAfter: new Date(Date.now() + reviewRequestEmailDelayMs),
    });
    return true;
  });

  if (queued) {
    track(
      { id: userId, isGuest: false },
      {
        event: "review_request:email_queue",
        properties: {
          finalized_poll_count: finalizedPollCount,
          participant_count: participantCount,
        },
      },
    );
  }
}

const failWith = (message: string) => () => new QueuedEmailFailed({ message });

/**
 * Sends the review request email queued by `queueReviewRequest`. The subject
 * is the user. The site is picked at send time, so a change to
 * REVIEW_REQUEST_BUSINESS_SITE applies to emails already queued.
 */
export const sendReviewRequest = Effect.fn("reviewRequest.sendReviewRequest")(
  function* ({ subjectId }: { id: string; subjectId: string }) {
    const user = yield* Effect.tryPromise({
      try: () => getReviewRequestRecipient(subjectId),
      catch: failWith("Failed to load the user"),
    });
    if (!user || user.deletedAt) {
      return yield* new QueuedEmailSkipped({ reason: "User no longer exists" });
    }
    if (user.banned) {
      return yield* new QueuedEmailSkipped({ reason: "User is banned" });
    }

    const site = pickReviewSite({
      email: user.email,
      businessSite: env.REVIEW_REQUEST_BUSINESS_SITE,
    });
    const branding = yield* Effect.tryPromise({
      try: () => getInstanceBranding(),
      catch: failWith("Failed to load branding"),
    });

    // The mailer logs and swallows transport failures, so its result is what
    // tells a sent email from a failed one.
    const sent = yield* Effect.tryPromise({
      try: () =>
        sendReviewRequestEmail({
          to: user.email,
          locale: user.locale ?? undefined,
          branding,
          // Replies go to a person: the email invites them.
          replyTo: env.SUPPORT_EMAIL,
          props: {
            firstName: getFirstName(user.name),
            siteName: reviewSites[site].name,
            reviewUrl: reviewSites[site].url,
            guidelinesUrl: getReviewGuidelinesUrl(site),
          },
        }),
      catch: failWith("Failed to send the review request email"),
    });
    if (!sent) {
      return yield* new QueuedEmailFailed({ message: "Transport failed" });
    }

    track(
      { id: subjectId, isGuest: false },
      {
        event: "review_request:email_send",
        properties: { destination: site },
      },
    );
  },
);
