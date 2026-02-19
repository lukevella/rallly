import { openai } from "@ai-sdk/openai";
import { createLogger } from "@rallly/logger";
import { generateText } from "ai";

const logger = createLogger("moderation/ai");

export type ModerationVerdict = "flagged" | "safe";

export type ModerationResult = {
  verdict: ModerationVerdict;
  reason: string;
};

/**
 * Moderates content using AI to detect inappropriate content
 * @param text The text to moderate
 * @returns The moderation result with verdict and explanation
 */
export async function moderateContentWithAI(
  text: string,
): Promise<ModerationResult> {
  try {
    const result = await generateText({
      model: openai("gpt-4.1-mini"),
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
    if (verdictLine.includes("FLAGGED")) {
      verdict = "flagged";
    }

    return { verdict, reason };
  } catch (err) {
    logger.error({ error: err }, "AI moderation failed");
    return {
      verdict: "safe",
      reason: "AI moderation failed, defaulting to safe",
    };
  }
}
