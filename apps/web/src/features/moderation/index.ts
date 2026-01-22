import { createLogger } from "@rallly/logger";
import { env } from "@/env";

import { moderateContentWithAI } from "./libs/ai-moderation";
import { containsSuspiciousPatterns } from "./libs/pattern-moderation";

const logger = createLogger("moderation");

/**
 * Moderates content to detect spam, inappropriate content, or abuse
 * Uses a two-layer approach:
 * 1. Pattern-based detection for common spam patterns
 * 2. AI-based moderation for more sophisticated content analysis
 *
 * @param content Array of strings to moderate (can include undefined values which will be filtered out)
 * @returns True if the content is flagged as inappropriate, false otherwise
 */
export async function moderateContent(content: Array<string | undefined>) {
  // Skip moderation if the feature is disabled in environment
  if (env.MODERATION_ENABLED !== "true") {
    return false;
  }

  // Check if OpenAI API key is available
  if (!env.OPENAI_API_KEY) {
    logger.warn(
      "Content moderation is enabled but OPENAI_API_KEY is not set. AI-based moderation will be skipped.",
    );
    return false;
  }

  const textToModerate = content.filter(Boolean).join("\n");

  // First check for suspicious patterns (faster)
  const hasSuspiciousPatterns = containsSuspiciousPatterns(textToModerate);

  // If suspicious patterns are found, perform AI moderation
  if (hasSuspiciousPatterns) {
    logger.info("Suspicious patterns detected, performing AI moderation check");
    try {
      const isFlagged = await moderateContentWithAI(textToModerate);
      if (isFlagged) {
        logger.warn("Content flagged by AI moderation");
      }
      return isFlagged;
    } catch (error) {
      logger.error({ error }, "Error during AI content moderation");
      return false;
    }
  }

  return false;
}

/**
 * Helper function to check if moderation is enabled
 * @returns True if moderation is enabled, false otherwise
 */
export function isModerationEnabled(): boolean {
  return env.MODERATION_ENABLED === "true";
}
