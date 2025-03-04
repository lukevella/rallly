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
export function containsSuspiciousPatterns(text: string) {
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

  // Check for potential contact information - enhanced to catch international formats
  const contactInfoPattern =
    /(\+\d{1,3}[-.\s]?)?(\d{3}[-.\s]?)?\d{3}[-.\s]?\d{4}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|\+\d{6,15}/i;

  // Check for full-width characters (often used in spam to bypass filters)
  const fullWidthCharsPattern = /[\uFF01-\uFF5E]/;

  // Check for unusual Unicode characters that might be used to obfuscate text
  const unusualUnicodePattern =
    /[\u1100-\u11FF\u2800-\u28FF\u2600-\u26FF\u2700-\u27BF\u1D00-\u1D7F\u1D80-\u1DBF\u1DC0-\u1DFF\u1E00-\u1EFF\u2000-\u206F\u2070-\u209F\u20A0-\u20CF\u20D0-\u20FF\u2100-\u214F\u2150-\u218F\u2190-\u21FF\u2200-\u22FF\u2300-\u23FF\u2400-\u243F\u2440-\u245F\u2460-\u24FF\u2500-\u257F\u2580-\u259F\u25A0-\u25FF\u2600-\u26FF\u2700-\u27BF\u27C0-\u27EF\u27F0-\u27FF\u2800-\u28FF\u2900-\u297F\u2980-\u29FF\u2A00-\u2AFF\u2B00-\u2BFF\u2C00-\u2C5F\u2C60-\u2C7F\u2C80-\u2CFF\u2D00-\u2D2F\u2D30-\u2D7F\u2D80-\u2DDF\u2DE0-\u2DFF\u2E00-\u2E7F\u2E80-\u2EFF\u2F00-\u2FDF\u2FF0-\u2FFF\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u3100-\u312F\u3130-\u318F\u3190-\u319F\u31A0-\u31BF\u31C0-\u31EF\u31F0-\u31FF\u3200-\u32FF\u3300-\u33FF\u3400-\u4DBF\u4DC0-\u4DFF\u4E00-\u9FFF\uA000-\uA48F\uA490-\uA4CF\uA4D0-\uA4FF\uA500-\uA63F\uA640-\uA69F\uA6A0-\uA6FF\uA700-\uA71F\uA720-\uA7FF\uA800-\uA82F\uA830-\uA83F\uA840-\uA87F\uA880-\uA8DF\uA8E0-\uA8FF\uA900-\uA92F\uA930-\uA95F\uA960-\uA97F\uA980-\uA9DF\uA9E0-\uA9FF\uAA00-\uAA5F\uAA60-\uAA7F\uAA80-\uAADF\uAAE0-\uAAFF\uAB00-\uAB2F\uAB30-\uAB6F\uAB70-\uABBF\uABC0-\uABFF\uAC00-\uD7AF\uD7B0-\uD7FF\uD800-\uDB7F\uDB80-\uDBFF\uDC00-\uDFFF\uE000-\uF8FF\uF900-\uFAFF\uFB00-\uFB4F\uFB50-\uFDFF\uFE00-\uFE0F\uFE10-\uFE1F\uFE20-\uFE2F\uFE30-\uFE4F\uFE50-\uFE6F\uFE70-\uFEFF\uFF00-\uFFEF\uFFF0-\uFFFF]/;

  // Check for excessive spaces between characters (common in spam)
  const excessiveSpacingPattern =
    /\s{2,}|\u00A0{2,}|\u2000{2,}|\u2001{2,}|\u2002{2,}|\u2003{2,}|\u2004{2,}|\u2005{2,}|\u2006{2,}|\u2007{2,}|\u2008{2,}|\u2009{2,}|\u200A{2,}|\u202F{2,}|\u205F{2,}|\u3000{2,}/;

  // Check for patterns that mix letters and numbers in suspicious ways (like "c4ll g1rl")
  const leetSpeakPattern = /[a-z0-9]*[0-9][a-z][0-9][a-z0-9]*/i;

  // Check for suspicious keywords often found in spam, with character substitutions
  const suspiciousKeywords =
    /(?:c[a@4]ll\s*g[i!1]rl|[e3][s$5]c[o0]rt|[s$5][e3]rv[i!1]c[e3]|m[a@4][s$5][s$5][a@4]g[e3]|d[a@4]t[i!1]ng|[a@4]dult|[s$5][e3]x)/i;

  // Check for international phone number patterns with various separators
  const internationalPhonePattern = /\+\d[\d\s\-\.]{5,14}/;

  return (
    allCapsPattern.test(text) ||
    excessiveSpecialCharsPattern.test(text) ||
    repetitiveCharsPattern.test(text) ||
    suspiciousUrlPattern.test(text) ||
    contactInfoPattern.test(text) ||
    fullWidthCharsPattern.test(text) ||
    unusualUnicodePattern.test(text) ||
    excessiveSpacingPattern.test(text) ||
    leetSpeakPattern.test(text) ||
    suspiciousKeywords.test(text) ||
    internationalPhonePattern.test(text)
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
