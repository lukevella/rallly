import { openai } from "@ai-sdk/openai";
import { createLogger } from "@rallly/logger";
import { generateText } from "ai";

const logger = createLogger("moderation/ai");

/**
 * Moderates content using OpenAI's GPT-4 to detect inappropriate content
 * @param text The text to moderate
 * @returns True if the content is flagged as inappropriate, false otherwise
 */
export async function moderateContentWithAI(text: string) {
  try {
    const result = await generateText({
      model: openai("gpt-4.1-nano"),
      messages: [
        {
          role: "system",
          content: `You are a content moderator for a scheduling and polling application. Users create polls about any topic — finding meeting times, making group decisions, voting on proposals, etc. Content may be in any language.

Flag the content ONLY if it clearly matches one of these categories:
- Phishing or scams: fake account notifications, brand impersonation (e.g. Binance, Coinbase, PayPal), "your balance/funds/account" language, urgency tactics to click external links
- Financial fraud: fake crypto mining, investment scams, unclaimed funds, lottery winnings
- Illegal activities: drugs, prostitution, illegal gambling
- Malicious links: content whose primary purpose is to trick readers into clicking an external link unrelated to the poll
- Spam relay: content that is not a genuine poll but a mass marketing message, advertisement, or message blast using the platform as a delivery mechanism

Do NOT flag content because it is in a non-English language, uses uppercase letters, is about a non-scheduling topic (e.g. votes, approvals, group decisions), or includes instructions for participants.

When in doubt, respond SAFE.

Respond with only 'FLAGGED' or 'SAFE'.`,
        },
        { role: "user", content: text },
      ],
    });

    return result.text.includes("FLAGGED");
  } catch (err) {
    logger.error({ error: err }, "AI moderation failed");
    return false;
  }
}
