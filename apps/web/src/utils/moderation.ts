import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

import { env } from "@/env";

async function moderateContentWithAI(text: string) {
  const result = await generateText({
    model: openai("gpt-4-turbo"),
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

  // Define all patterns
  const repetitiveCharsPattern = /(.)\1{4,}/;
  const allCapsPattern = /[A-Z]{5,}/;
  const excessiveSpecialCharsPattern =
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{4,}/;
  const suspiciousUrlPattern = /(bit\.ly|tinyurl|goo\.gl|t\.co|is\.gd)/i;
  const suspiciousKeywords =
    /(?:c[a@4]ll\s*g[i!1]rl|[e3][s$5]c[o0]rt|[s$5][e3]rv[i!1]c[e3]|m[a@4][s$5][s$5][a@4]g[e3]|d[a@4]t[i!1]ng|[a@4]dult|[s$5][e3]x)/i;

  // Email address pattern
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;

  // Comprehensive phone number pattern covering various formats
  const phoneNumberPattern =
    /(\+?\d{1,3}[-.\s]?)?(\d{3}[-.\s]?)?\d{3}[-.\s]?\d{4}|\+\d[\d\s\-\.]{5,14}|\+\d{6,15}/i;

  const nonStandardCharsPattern = /[^\x20-\x7E]/;

  // Return true if any pattern matches
  return (
    repetitiveCharsPattern.test(text) ||
    allCapsPattern.test(text) ||
    excessiveSpecialCharsPattern.test(text) ||
    suspiciousUrlPattern.test(text) ||
    suspiciousKeywords.test(text) ||
    emailPattern.test(text) ||
    phoneNumberPattern.test(text) ||
    nonStandardCharsPattern.test(text)
  );
}

export async function moderateContent(...content: Array<string | undefined>) {
  if (!env.OPENAI_API_KEY) {
    console.info("OPENAI_API_KEY not set, skipping moderation");
    return false;
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

  return false;
}
