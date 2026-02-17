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
          content: `You are a content moderator for a meeting scheduling app where users create polls to find the best time to meet. Analyze the following text (which is the title and/or description of a poll) and determine if it is legitimate scheduling content or an abuse attempt.

Flag the content as inappropriate if it matches ANY of these categories:
- Phishing or scams: fake account notifications, impersonation of brands (e.g. Binance, Coinbase, PayPal), "your balance/funds/account" language, urgency tactics to click links
- Spam relay abuse: content that is clearly not a scheduling poll but instead a message designed to be sent to participants via notification emails
- Financial fraud: fake crypto mining, investment scams, unclaimed funds, lottery winnings
- Illegal activities: drugs, prostitution, illegal gambling
- Malicious links: content whose primary purpose is to get readers to click an external link unrelated to scheduling

Legitimate polls typically have short titles like "Team lunch", "Q3 planning", or "Meeting next week" and may include a location or brief context. They do NOT contain financial claims, cryptocurrency amounts, account notifications, or urgent calls to action.

Respond with 'FLAGGED' if the content is inappropriate, otherwise 'SAFE'.`,
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
