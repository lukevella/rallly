import { createSignature, verifySignature } from "@/lib/signature";

const SIGNING_CONTEXT = "unsubscribe";

// Not "." — the proxy matcher treats any dotted path as a static asset and
// skips the locale rewrite, which 404s the confirmation page.
const SEPARATOR = "~";

/**
 * What an unsubscribe token acts on. New notifying entities (sign-up sheets)
 * add a member here; the route and page stay the same.
 */
export type UnsubscribeTarget = {
  kind: "poll";
  pollId: string;
  userId: string;
};

/**
 * A bearer token that lets the recipient mute one item without logging in.
 * It never expires: the email it ships in can sit in an inbox for months, and
 * the worst a leaked token can do is mute something its owner can unmute in
 * the UI.
 */
export function createUnsubscribeToken({
  target,
  secret,
}: {
  target: UnsubscribeTarget;
  secret: string;
}) {
  const payload = Buffer.from(
    JSON.stringify({ k: target.kind, p: target.pollId, u: target.userId }),
  ).toString("base64url");
  const signature = createSignature({
    context: SIGNING_CONTEXT,
    payload,
    secret,
  });
  return `${payload}${SEPARATOR}${signature}`;
}

export function parseUnsubscribeToken({
  token,
  secret,
}: {
  token: string;
  secret: string;
}): UnsubscribeTarget | null {
  const [payload, signature, ...rest] = token.split(SEPARATOR);
  if (
    !payload ||
    !signature ||
    rest.length > 0 ||
    !verifySignature({ context: SIGNING_CONTEXT, payload, secret, signature })
  ) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(payload, "base64url").toString(),
    );
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "k" in parsed &&
      parsed.k === "poll" &&
      "p" in parsed &&
      "u" in parsed &&
      typeof parsed.p === "string" &&
      typeof parsed.u === "string"
    ) {
      return { kind: "poll", pollId: parsed.p, userId: parsed.u };
    }
  } catch {
    // Malformed payload: fall through
  }
  return null;
}
