import "server-only";

import { openai } from "@ai-sdk/openai";
import { createLogger } from "@rallly/logger";
import { generateText } from "ai";
import { MODERATION_AI_FAILURE_REASON } from "./constants";
import type { ModerationResult, ModerationVerdict } from "./types";

const logger = createLogger("moderation/ai");

const AI_REQUEST_TIMEOUT_MS = 30_000;

// Every flag costs the user a strike and three strikes ban them, so the
// prompt names exactly what counts. Impersonation is defined by the host,
// not by how official the destination looks: with reasoning off, the model
// called links to real government sites impersonations of them.
const SYSTEM_PROMPT = `You are a content moderator for a scheduling and polling application. Users create polls about any topic — finding meeting times, making group decisions, voting on proposals, etc. Content may be in any language.

Respond with one of two verdicts:
- FLAGGED: Content is clearly abusive and harmful to the platform. Use this for:
  - Phishing or scams: fake account, payment, invoice or subscription notices; requests to call a support number, verify an identity, or reset a password; brand impersonation
  - Financial fraud: fake crypto mining, investment scams, unclaimed funds, lottery winnings
  - Illegal activities: illegal drugs, prostitution, illegal gambling

- SAFE: Content is not harmful.

Brand impersonation means content that claims to come from a company or institution while pointing people at a website or phone number that does not belong to it. Judge a link by its hostname:
- A link whose hostname is the organization's own domain or a subdomain of it (paypal.com, gov.uk) is not impersonation, however official or sensitive the page is.
- A link to an official page that does not match its link text is a copy and paste mistake, not phishing.
- Links to well known services (documents, video calls, maps) are normal in meeting invitations. A shortened link is not phishing on its own; judge the rest of the content.

Do NOT flag content because:
- It is in a non-English language
- It is short, brief, or lacks detail
- It is ambiguous or unclear
- It links to a government, bank or other official website
- It shares a document, a password or other details with the people invited

When in doubt, choose SAFE.

Respond in exactly this format:
VERDICT
Brief explanation of why this verdict was chosen.`;

/**
 * Asks the model for a verdict on text that tripped the prefilter. Fails
 * open: a model error or timeout is a safe verdict, because the prefilter
 * sends most legitimate polls with a link here.
 */
export async function classifyContent(text: string): Promise<ModerationResult> {
  try {
    const result = await generateText({
      model: openai("gpt-6-luna"),
      providerOptions: { openai: { reasoningEffort: "low" } },
      abortSignal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: text }],
    });

    const lines = result.text.trim().split("\n");
    const verdictLine = (lines[0] ?? "").trim().toUpperCase();
    const reason = lines.slice(1).join("\n").trim() || "No reason provided";

    const verdict: ModerationVerdict = verdictLine.startsWith("FLAGGED")
      ? "flagged"
      : "safe";

    return { verdict, reason };
  } catch (err) {
    logger.error({ error: err }, "AI moderation failed");
    return {
      verdict: "safe",
      reason: MODERATION_AI_FAILURE_REASON,
    };
  }
}
