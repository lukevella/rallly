import "server-only";

import { createHash } from "node:crypto";
import { sendRawEmail } from "@rallly/emails";
import { createLogger } from "@rallly/logger";
import { after } from "next/server";
import { env } from "@/env";
import { cancelUserSubscriptions } from "@/features/billing/mutations";
import { banUser } from "@/features/user/mutations";
import { createRatelimit } from "@/lib/rate-limit";
import {
  MODERATION_AI_CALLS_PER_DAY,
  MODERATION_STRIKE_WINDOW,
  MODERATION_STRIKES_BEFORE_BAN,
} from "./constants";
import { classifyContent } from "./service";
import type { ModerationResult } from "./types";
import { containsSuspiciousPatterns } from "./utils";

const logger = createLogger("moderation");

function getBannedDomains(): string[] {
  const csv = env.BANNED_DOMAINS;
  if (!csv) return [];
  return csv
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

function containsBannedDomain(text: string): boolean {
  const domains = getBannedDomains();
  if (domains.length === 0) return false;
  const lower = text.toLowerCase();
  return domains.some((domain) => lower.includes(domain));
}

const safeResult: ModerationResult = {
  verdict: "safe",
  reason: "",
};

// One point per flagged verdict. The limiter is a counter here, not a gate:
// the request that spends the last point is the one that bans.
const strikes = createRatelimit(
  MODERATION_STRIKES_BEFORE_BAN,
  MODERATION_STRIKE_WINDOW,
);

// A user whose poll is blocked submits it again. Only the first flag of the
// same content in the window is a strike, so one wrong verdict cannot ban
// on its own; a scammer rewording still collects one strike per rewrite.
const flaggedContent = createRatelimit(1, MODERATION_STRIKE_WINDOW);

function contentFingerprint(text: string) {
  return createHash("sha256")
    .update(text.toLowerCase().replace(/\s+/g, " ").trim())
    .digest("hex");
}

async function isRepeatFlag(userId: string, text: string) {
  try {
    const seen = await flaggedContent?.limit(
      `moderation-content:${userId}:${contentFingerprint(text)}`,
    );
    return seen ? !seen.success : false;
  } catch (error) {
    // Unknown is not a first flag: a store fault must not count a strike.
    logger.error({ error, userId }, "Could not check for repeated content");
    return null;
  }
}

const aiBudget = createRatelimit(MODERATION_AI_CALLS_PER_DAY, "24 h");

// True when this user may spend another model call today. A store failure
// allows the call: the budget is a cost cap, not a security boundary.
async function withinAiBudget(userId: string) {
  try {
    const budget = await aiBudget?.limit(`moderation-ai:${userId}`);
    return budget?.success ?? true;
  } catch (error) {
    logger.error({ error, userId }, "Could not read moderation AI budget");
    return true;
  }
}

// A banned scammer's next move is a chargeback, which costs more than the
// subscription, so the ban and the cancellation are one step. A Stripe
// failure is logged and never undoes the ban. Shared with the control
// panel's manual ban, which is the same decision made by a person.
export async function banUserForAbuse({
  userId,
  reason,
}: {
  userId: string;
  reason: string;
}) {
  await banUser({ userId, reason });
  try {
    await cancelUserSubscriptions({ userId });
  } catch (error) {
    logger.error(
      { error, userId },
      "User banned but their subscriptions could not be cancelled",
    );
  }
}

async function recordStrike(userId: string, text: string) {
  const repeat = await isRepeatFlag(userId, text);
  if (repeat !== false) {
    return { count: null, banned: false, repeat: repeat === true };
  }
  let strike: Awaited<ReturnType<NonNullable<typeof strikes>["limit"]>> | null;
  try {
    strike = (await strikes?.limit(`moderation:${userId}`)) ?? null;
  } catch (error) {
    // The store is a counter here, not a gate: losing a strike is better
    // than losing the support email that follows.
    logger.error({ error, userId }, "Could not record moderation strike");
    strike = null;
  }
  if (!strike) {
    return { count: null, banned: false, repeat: false };
  }
  const count = strike.success
    ? MODERATION_STRIKES_BEFORE_BAN - strike.remainingPoints
    : MODERATION_STRIKES_BEFORE_BAN;
  const banned = count >= MODERATION_STRIKES_BEFORE_BAN;
  if (banned) {
    logger.warn({ userId, count }, "Moderation strike limit reached, banning");
    await banUserForAbuse({
      userId,
      reason: `Automatic ban: ${count} pieces of content flagged by moderation within ${MODERATION_STRIKE_WINDOW}`,
    });
  }
  return { count, banned, repeat: false };
}

/**
 * Moderates content to detect spam, inappropriate content, or abuse
 * Uses a two-layer approach:
 * 1. Pattern-based detection for common spam patterns
 * 2. AI-based moderation for more sophisticated content analysis
 *
 * A flagged verdict always blocks. Paid users are not exempt: the two most
 * recent abuse cases were Pro subscriptions. Flags on distinct content ban
 * the user (see recordStrike); resubmitting the same content does not.
 *
 * @returns Moderation result with verdict and explanation
 */
export async function moderateContent({
  userId,
  userEmail,
  content,
}: {
  userId: string;
  userEmail?: string;
  content: Record<string, string>;
}): Promise<ModerationResult> {
  // Skip moderation if the feature is disabled in environment
  if (env.MODERATION_ENABLED !== "true") {
    return safeResult;
  }

  // Check if OpenAI API key is available
  if (!env.OPENAI_API_KEY) {
    logger.warn(
      "Content moderation is enabled but OPENAI_API_KEY is not set. AI-based moderation will be skipped.",
    );
    return safeResult;
  }

  const textToModerate = Object.entries(content)
    .filter(([_, value]) => value.trim() !== "")
    .map(([key, value]) => `${key}:\n${value}`)
    .join("\n\n");

  // Check for banned domains — auto-ban the user immediately
  if (containsBannedDomain(textToModerate)) {
    logger.warn({ userId }, "Banned domain detected, banning user");
    after(() =>
      banUserForAbuse({
        userId,
        reason: "Automatic ban: banned domain detected in content",
      }),
    );
    return {
      verdict: "flagged",
      reason: "Content contains a banned domain",
    };
  }

  // First check for suspicious patterns (faster)
  const hasSuspiciousPatterns = containsSuspiciousPatterns(textToModerate);

  // If suspicious patterns are found, perform AI moderation
  if (hasSuspiciousPatterns) {
    // Fail closed for suspicious content only: clean content never reaches
    // this branch, so an exhausted budget blocks nothing a legitimate user
    // writes at that volume.
    if (!(await withinAiBudget(userId))) {
      logger.warn(
        { userId },
        "Moderation AI budget exhausted, flagging without a model call",
      );
      return {
        verdict: "flagged",
        reason: `More than ${MODERATION_AI_CALLS_PER_DAY} pieces of suspicious content in 24 hours`,
      };
    }

    logger.info("Suspicious patterns detected, performing AI moderation check");
    try {
      const result = await classifyContent(textToModerate);

      if (result.verdict === "flagged") {
        logger.warn(
          { userId, verdict: result.verdict, reason: result.reason },
          `Content ${result.verdict} by AI moderation`,
        );
        after(async () => {
          const strike = await recordStrike(userId, textToModerate);
          await sendRawEmail({
            to: env.SUPPORT_EMAIL,
            subject: strike.banned
              ? "User banned after repeated flagged content"
              : `Content ${result.verdict} by moderation`,
            text: [
              `User ID: ${userId}`,
              `User Email: ${userEmail ?? "unknown"}`,
              `Strike: ${strike.repeat ? "not counted, same content as an earlier flag" : `${strike.count ?? "not counted"} of ${MODERATION_STRIKES_BEFORE_BAN}`}`,
              `Banned: ${strike.banned ? "Yes" : "No"}`,
              `Verdict: ${result.verdict}`,
              `Reason: ${result.reason}`,
              "--------------------------------",
              textToModerate,
            ].join("\n\n"),
          });
        });
      }

      return result;
    } catch (error) {
      logger.error({ error }, "Error during AI content moderation");
      return safeResult;
    }
  }

  return safeResult;
}

/**
 * Helper function to check if moderation is enabled
 * @returns True if moderation is enabled, false otherwise
 */
export function isModerationEnabled(): boolean {
  return env.MODERATION_ENABLED === "true";
}
