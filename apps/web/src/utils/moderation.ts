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
          "You are a content moderator. Analyze the following text and determine if it is attempting to misuse the app to advertise illegal drugs, prostitution, or promote illegal gambling and other illicit activities. Respond with 'FLAGGED' if detected, otherwise 'SAFE'.",
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

  // Email address pattern
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;

  // Comprehensive phone number pattern covering various formats
  const phoneNumberPattern =
    /(\+?\d{1,3}[-.\s]?)?(\d{3}[-.\s]?)?\d{3}[-.\s]?\d{4}|\+\d[\d\s\-\.]{5,14}|\+\d{6,15}/i;

  // Detect suspicious Unicode patterns
  const suspiciousUnicodePattern =
    /[\u2028-\u202F\u2800-\u28FF\u3164\uFFA0\u115F\u1160\u3000\u2000-\u200F\u2028-\u202F\u205F-\u206F\uFEFF\uDB40\uDC20\uDB40\uDC21\uDB40\uDC22\uDB40\uDC23\uDB40\uDC24]/u;

  // Simple leet speak pattern that detects number-letter-number patterns
  const leetSpeakPattern = /[a-z0-9]*[0-9][a-z][0-9][a-z0-9]*/i;

  return (
    // Simple pattern checks (least intensive)
    allCapsPattern.test(text) ||
    repetitiveCharsPattern.test(text) ||
    excessiveSpecialCharsPattern.test(text) ||
    // Medium complexity patterns
    suspiciousUrlPattern.test(text) ||
    emailPattern.test(text) ||
    leetSpeakPattern.test(text) ||
    // More complex patterns
    phoneNumberPattern.test(text) ||
    // Most intensive pattern (Unicode handling)
    suspiciousUnicodePattern.test(text)
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
