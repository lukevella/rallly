import { createLogger } from "@rallly/logger";
import { waitUntil } from "@vercel/functions";
import { env } from "@/env";
import { getEmailClient } from "@/utils/emails";
import type { ModerationResult, ModerationVerdict } from "./libs/ai-moderation";
import { moderateContentWithAI } from "./libs/ai-moderation";
import { containsSuspiciousPatterns } from "./libs/pattern-moderation";

const logger = createLogger("moderation");

export type { ModerationResult, ModerationVerdict };

const safeResult: ModerationResult = {
  verdict: "safe",
  reason: "",
};

/**
 * Moderates content to detect spam, inappropriate content, or abuse
 * Uses a two-layer approach:
 * 1. Pattern-based detection for common spam patterns
 * 2. AI-based moderation for more sophisticated content analysis
 *
 * @returns Moderation result with verdict and explanation
 */
export async function moderateContent({
  userId,
  content,
}: {
  userId: string;
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

  // First check for suspicious patterns (faster)
  const hasSuspiciousPatterns = containsSuspiciousPatterns(textToModerate);

  // If suspicious patterns are found, perform AI moderation
  if (hasSuspiciousPatterns) {
    logger.info("Suspicious patterns detected, performing AI moderation check");
    try {
      const result = await moderateContentWithAI(textToModerate);

      if (result.verdict === "flagged" || result.verdict === "suspicious") {
        logger.warn(
          { userId, verdict: result.verdict, reason: result.reason },
          `Content ${result.verdict} by AI moderation`,
        );
        const emailClient = await getEmailClient();
        waitUntil(
          emailClient.sendEmail({
            to: env.SUPPORT_EMAIL,
            subject: `Content ${result.verdict} by moderation`,
            text: [
              `User ID: ${userId}`,
              `Verdict: ${result.verdict}`,
              `Reason: ${result.reason}`,
              "Content:",
              textToModerate,
            ].join("\n\n"),
          }),
        );
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
