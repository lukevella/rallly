import { openai } from "@ai-sdk/openai";
import { createLogger } from "@rallly/logger";
import { generateText } from "ai";

const logger = createLogger("moderation/ai");

export type ModerationVerdict = "flagged" | "suspicious" | "safe";

/**
 * Moderates content using AI to detect inappropriate content
 * @param text The text to moderate
 * @returns The moderation verdict: "flagged", "suspicious", or "safe"
 */
export async function moderateContentWithAI(
  text: string,
): Promise<ModerationVerdict> {
  try {
    const result = await generateText({
      model: openai("gpt-4.1-mini"),
      messages: [
        {
          role: "system",
          content: `You are a content moderator for a scheduling and polling application. Users create polls about any topic — finding meeting times, making group decisions, voting on proposals, etc. Content may be in any language.

Respond with one of three verdicts:
- FLAGGED: Content is clearly abusive and should be blocked. Use this for:
  - Phishing or scams: fake account notifications, brand impersonation (e.g. Binance, Coinbase, PayPal), "your balance/funds/account" language, urgency tactics to click external links
  - Financial fraud: fake crypto mining, investment scams, unclaimed funds, lottery winnings
  - Illegal activities: drugs, prostitution, illegal gambling
  - Malicious links: content whose primary purpose is to trick readers into clicking an external link unrelated to the poll
  - Spam relay: content that is not a genuine poll but a mass marketing message, advertisement, or message blast using the platform as a delivery mechanism

- SUSPICIOUS: Content is ambiguous — it could be legitimate but has characteristics that warrant human review. Use this when content doesn't clearly fit the FLAGGED categories but seems unusual for a polling app.

- SAFE: Content is clearly legitimate.

Do NOT flag or mark as suspicious content because it is in a non-English language, uses uppercase letters, is about a non-scheduling topic (e.g. votes, approvals, group decisions), or includes instructions for participants.

When in doubt between FLAGGED and SUSPICIOUS, choose SUSPICIOUS.
When in doubt between SUSPICIOUS and SAFE, choose SAFE.

Respond with only 'FLAGGED', 'SUSPICIOUS', or 'SAFE'.`,
        },
        { role: "user", content: text },
      ],
    });

    const response = result.text.trim().toUpperCase();

    if (response.includes("FLAGGED")) {
      return "flagged";
    }

    if (response.includes("SUSPICIOUS")) {
      return "suspicious";
    }

    return "safe";
  } catch (err) {
    logger.error({ error: err }, "AI moderation failed");
    return "safe";
  }
}
