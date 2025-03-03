import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

import { env } from "@/env";

async function moderateContentWithAI(text: string) {
  const result = await generateText({
    model: openai("gpt-3.5-turbo"),
    messages: [
      {
        role: "system",
        content:
          "You are a content moderator. Analyze the following text and determine if it is advertising illegal drugs or promoting prostitution. Respond with 'FLAGGED' if detected, otherwise 'SAFE'.",
      },
      { role: "user", content: text },
    ],
  });

  return result.text.trim() === "FLAGGED";
}

// Custom pattern-based checks
function containsSuspiciousPatterns(text: string) {
  if (!text) return false;

  // Check for ALL CAPS (if more than 5 consecutive capital letters)
  const allCapsPattern = /[A-Z]{5,}/;

  // Check for excessive special characters
  const excessiveSpecialCharsPattern =
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{4,}/;

  // Check for repetitive characters
  const repetitiveCharsPattern = /(.)\1{4,}/;

  // Check for suspicious URLs
  const suspiciousUrlPattern = /(bit\.ly|tinyurl|goo\.gl|t\.co|is\.gd)/i;

  // Check for potential contact information
  const contactInfoPattern =
    /(\+\d{1,3}[-.\s]?)?(\d{3}[-.\s]?)?\d{3}[-.\s]?\d{4}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;

  return (
    allCapsPattern.test(text) ||
    excessiveSpecialCharsPattern.test(text) ||
    repetitiveCharsPattern.test(text) ||
    suspiciousUrlPattern.test(text) ||
    contactInfoPattern.test(text)
  );
}

export async function moderateContent(...content: Array<string | undefined>) {
  if (!env.OPENAI_API_KEY) {
    console.info("OPENAI_API_KEY not set, skipping moderation");
    return true;
  }

  const textToModerate = content.filter(Boolean).join("\n");

  const hasSuspiciousPatterns = containsSuspiciousPatterns(textToModerate);

  if (hasSuspiciousPatterns) {
    try {
      return moderateContentWithAI(textToModerate);
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  return true;
}
