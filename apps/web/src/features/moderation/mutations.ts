import "server-only";

import { openai } from "@ai-sdk/openai";
import { sendRawEmail } from "@rallly/emails";
import { createLogger } from "@rallly/logger";
import { generateText } from "ai";
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
import type { ModerationResult, ModerationVerdict } from "./types";
import { containsSuspiciousPatterns } from "./utils";

const logger = createLogger("moderation");
const aiLogger = createLogger("moderation/ai");

const AI_REQUEST_TIMEOUT_MS = 30_000;

/**
 * Moderates content using AI to detect inappropriate content
 * @param text The text to moderate
 * @returns The moderation result with verdict and explanation
 */
async function moderateContentWithAI(text: string): Promise<ModerationResult> {
  try {
    const result = await generateText({
      model: openai("gpt-4.1"),
      abortSignal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
      messages: [
        {
          role: "system",
          content: `You are a content moderator for a scheduling and polling application. Users create polls about any topic — finding meeting times, making group decisions, voting on proposals, etc. Content may be in any language.

Respond with one of two verdicts:
- FLAGGED: Content is clearly abusive and harmful to the platform. Use this for:
  - Phishing or scams: fake account notifications, brand impersonation
  - Financial fraud: fake crypto mining, investment scams, unclaimed funds, lottery winnings
  - Illegal activities: drugs, prostitution, illegal gambling

- SAFE: Content is not harmful.

Do NOT flag content because:
- It is in a non-English language
- It is short, brief, or lacks detail
- It is ambiguous or unclear

When in doubt, choose SAFE.

Respond in exactly this format:
VERDICT
Brief explanation of why this verdict was chosen.`,
        },
        { role: "user", content: text },
      ],
    });

    const lines = result.text.trim().split("\n");
    const verdictLine = (lines[0] ?? "").trim().toUpperCase();
    const reason = lines.slice(1).join("\n").trim() || "No reason provided";

    let verdict: ModerationVerdict = "safe";
    if (verdictLine.startsWith("FLAGGED")) {
      verdict = "flagged";
    }

    return { verdict, reason };
  } catch (err) {
    aiLogger.error({ error: err }, "AI moderation failed");
    return {
      verdict: "safe",
      reason: "AI moderation failed, defaulting to safe",
    };
  }
}

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

async function recordStrike(userId: string) {
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
    return { count: null, banned: false };
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
  return { count, banned };
}

/**
 * Moderates content to detect spam, inappropriate content, or abuse
 * Uses a two-layer approach:
 * 1. Pattern-based detection for common spam patterns
 * 2. AI-based moderation for more sophisticated content analysis
 *
 * A flagged verdict always blocks. Paid users are not exempt: the two most
 * recent abuse cases were Pro subscriptions, and no flag in the last 90
 * days was a false positive. Repeated flags ban the user (see recordStrike).
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
      const result = await moderateContentWithAI(textToModerate);

      if (result.verdict === "flagged") {
        logger.warn(
          { userId, verdict: result.verdict, reason: result.reason },
          `Content ${result.verdict} by AI moderation`,
        );
        after(async () => {
          const strike = await recordStrike(userId);
          await sendRawEmail({
            to: env.SUPPORT_EMAIL,
            subject: strike.banned
              ? "User banned after repeated flagged content"
              : `Content ${result.verdict} by moderation`,
            text: [
              `User ID: ${userId}`,
              `User Email: ${userEmail ?? "unknown"}`,
              `Strike: ${strike.count ?? "not counted"} of ${MODERATION_STRIKES_BEFORE_BAN}`,
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
