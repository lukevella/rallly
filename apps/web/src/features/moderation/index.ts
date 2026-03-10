import { prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import { after } from "next/server";
import { env } from "@/env";
import { getEmailClient } from "@/utils/emails";
import type { ModerationResult, ModerationVerdict } from "./libs/ai-moderation";
import { moderateContentWithAI } from "./libs/ai-moderation";
import { containsSuspiciousPatterns } from "./libs/pattern-moderation";

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
  trusted = false,
}: {
  userId: string;
  content: Record<string, string>;
  trusted?: boolean;
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
      prisma.user.update({
        where: { id: userId },
        data: {
          banned: true,
          bannedAt: new Date(),
          banReason: "Automatic ban: banned domain detected in content",
        },
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
    logger.info("Suspicious patterns detected, performing AI moderation check");
    try {
      const result = await moderateContentWithAI(textToModerate);

      if (result.verdict === "flagged") {
        logger.warn(
          { userId, verdict: result.verdict, reason: result.reason },
          `Content ${result.verdict} by AI moderation`,
        );
        const emailClient = await getEmailClient();
        after(() =>
          emailClient.sendEmail({
            to: env.SUPPORT_EMAIL,
            subject: `Content ${result.verdict} by moderation`,
            text: [
              `User ID: ${userId}`,
              `Trusted: ${trusted ? "Yes" : "No"}`,
              `Verdict: ${result.verdict}`,
              `Reason: ${result.reason}`,
              "--------------------------------",
              textToModerate,
            ].join("\n\n"),
          }),
        );

        if (trusted) {
          logger.info(
            { userId },
            "Content flagged but user is trusted, allowing through",
          );
          return safeResult;
        }
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
