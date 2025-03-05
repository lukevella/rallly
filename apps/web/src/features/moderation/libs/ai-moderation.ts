import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

/**
 * Moderates content using OpenAI's GPT-4 to detect inappropriate content
 * @param text The text to moderate
 * @returns True if the content is flagged as inappropriate, false otherwise
 */
export async function moderateContentWithAI(text: string) {
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
