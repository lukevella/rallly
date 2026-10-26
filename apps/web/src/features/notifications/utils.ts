import { parsePollActivity } from "@/features/activity/schema";
import { createSignature, verifySignature } from "@/lib/signature";
import {
  defaultNotificationPreferences,
  inboxActivityTypes,
} from "./constants";
import type { NotificationPreferences } from "./schema";
import {
  activityEventTypes,
  getNotificationPreferenceKey,
  notificationPreferencesSchema,
} from "./schema";

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

export function parseNotificationPreferences(
  prefs: unknown,
): NotificationPreferences {
  const parsed = notificationPreferencesSchema.safeParse(prefs);
  return {
    ...defaultNotificationPreferences,
    ...(parsed.success ? parsed.data : {}),
  };
}

/** The activity types the user has asked to see in their inbox. */
export function getInboxActivityTypes(prefs: NotificationPreferences) {
  return activityEventTypes
    .filter((type) => prefs[getNotificationPreferenceKey(type, "inApp")])
    .map((type) => inboxActivityTypes[type]);
}

/**
 * The event an inbox entry's activity notified about, or null when this
 * version of the vocabulary can't render it.
 */
export function toInboxEvent(
  activity: Parameters<typeof parsePollActivity>[0],
) {
  const event = parsePollActivity(activity);
  switch (event?.type) {
    case "response_created":
      return {
        type: "poll.response.submitted" as const,
        actorName: event.payload.name,
      };
    case "comment_added":
      return {
        type: "poll.comment.added" as const,
        actorName: event.payload.name,
      };
    default:
      return null;
  }
}
