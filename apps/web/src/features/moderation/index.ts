import { createLogger } from "@rallly/logger";
import { waitUntil } from "@vercel/functions";
import { env } from "@/env";
import { getEmailClient } from "@/utils/emails";
import type { ModerationVerdict } from "./libs/ai-moderation";
import { moderateContentWithAI } from "./libs/ai-moderation";
import { containsSuspiciousPatterns } from "./libs/pattern-moderation";

const logger = createLogger("moderation");

export type { ModerationVerdict };

/**
 * Moderates content to detect spam, inappropriate content, or abuse
 * Uses a two-layer approach:
 * 1. Pattern-based detection for common spam patterns
 * 2. AI-based moderation for more sophisticated content analysis
 *
 * @returns "flagged" (block), "suspicious" (allow but notify), or "safe" (allow)
 */
export async function moderateContent({
  userId,
  content,
}: {
  userId: string;
  content: Array<string | undefined>;
}): Promise<ModerationVerdict> {
  // Skip moderation if the feature is disabled in environment
  if (env.MODERATION_ENABLED !== "true") {
    return "safe";
  }

  // Check if OpenAI API key is available
  if (!env.OPENAI_API_KEY) {
    logger.warn(
      "Content moderation is enabled but OPENAI_API_KEY is not set. AI-based moderation will be skipped.",
    );
    return "safe";
  }

  const textToModerate = content.filter(Boolean).join("\n");

  // First check for suspicious patterns (faster)
  const hasSuspiciousPatterns = containsSuspiciousPatterns(textToModerate);

  // If suspicious patterns are found, perform AI moderation
  if (hasSuspiciousPatterns) {
    logger.info("Suspicious patterns detected, performing AI moderation check");
    try {
      const verdict = await moderateContentWithAI(textToModerate);

      if (verdict === "flagged" || verdict === "suspicious") {
        logger.warn({ userId, verdict }, `Content ${verdict} by AI moderation`);
        const emailClient = await getEmailClient();
        waitUntil(
          emailClient.sendEmail({
            to: env.SUPPORT_EMAIL,
            subject: `Content ${verdict} by moderation`,
            text: [
              `User ID: ${userId}`,
              `Verdict: ${verdict}`,
              "Content:",
              textToModerate,
            ].join("\n\n"),
          }),
        );
      }

      return verdict;
    } catch (error) {
      logger.error({ error }, "Error during AI content moderation");
      return "safe";
    }
  }

  return "safe";
}

/**
 * Helper function to check if moderation is enabled
 * @returns True if moderation is enabled, false otherwise
 */
export function isModerationEnabled(): boolean {
  return env.MODERATION_ENABLED === "true";
}
