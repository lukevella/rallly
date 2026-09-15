import { absoluteUrl, shortUrl } from "@rallly/utils/absolute-url";
import { pollActivitySchema } from "@/features/poll/activity/schema";
import { RETRY_DELAYS_MS } from "./constants";
import type { WebhookEvent, WebhookEventType } from "./schema";

/**
 * Stripe-style signature: `t=<unix seconds>,v1=<hex hmac-sha256>` over
 * `${t}.${body}`. Including the timestamp in the signed string lets a
 * receiver reject replays without the signature itself carrying state.
 * Web Crypto rather than node:crypto keeps this module importable from
 * schema.ts, which client forms validate with.
 */
export async function signWebhookBody({
  secret,
  body,
  timestamp,
}: {
  secret: string;
  body: string;
  timestamp: number;
}) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${timestamp}.${body}`),
  );
  const digest = Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `t=${timestamp},v1=${digest}`;
}

/**
 * Delay before the next attempt given how many attempts have been made, or
 * null once the schedule is exhausted.
 */
export function getRetryDelayMs(attempts: number) {
  return RETRY_DELAYS_MS[attempts - 1] ?? null;
}

const ACTIVITY_EVENTS: Record<string, WebhookEventType> = {
  poll_closed: "poll.closed",
  poll_reopened: "poll.reopened",
  poll_scheduled: "poll.scheduled",
};

export const WEBHOOK_ACTIVITY_TYPES = Object.keys(ACTIVITY_EVENTS);

export function toWebhookEventType(activityType: string) {
  return ACTIVITY_EVENTS[activityType] ?? null;
}

// All-day options are stored as UTC midnight of the calendar date, so the
// date is the first ten characters of the ISO string.
function toOptionPayload(
  kind: "date" | "time",
  option: { id: string; start: string; duration: number },
) {
  if (kind === "date") {
    return { id: option.id, date: option.start.slice(0, 10) };
  }
  return { id: option.id, startTime: option.start, duration: option.duration };
}

/**
 * Builds the event envelope for an activity row. The poll's status comes from
 * the transition the activity records, never from the live poll: by the time
 * a delivery is retried the poll may have moved on, and each transition is
 * its own event. Returns null for activities that are not webhook events or
 * whose payload this version can't interpret.
 */
export function buildWebhookPayload({
  activity,
  poll,
}: {
  activity: {
    id: string;
    type: string;
    optionId: string | null;
    payload: unknown;
    createdAt: Date;
  };
  poll: {
    id: string;
    title: string;
    kind: "date" | "time";
    timeZone: string | null;
  };
}): WebhookEvent | null {
  const parsed = pollActivitySchema.safeParse({
    type: activity.type,
    userId: null,
    optionId: activity.optionId ?? undefined,
    payload: activity.payload,
  });

  if (!parsed.success) {
    return null;
  }

  const event = parsed.data;
  const base = {
    id: activity.id,
    createdAt: activity.createdAt.toISOString(),
  };
  const pollPayload = (status: "open" | "closed" | "scheduled") => ({
    id: poll.id,
    title: poll.title,
    status,
    kind: poll.kind,
    timeZone: poll.timeZone,
    adminUrl: absoluteUrl(`/poll/${poll.id}`),
    inviteUrl: shortUrl(`/invite/${poll.id}`),
  });

  switch (event.type) {
    case "poll_closed":
      return {
        ...base,
        type: "poll.closed",
        data: { poll: pollPayload("closed"), reason: event.payload.reason },
      };
    case "poll_reopened":
      return {
        ...base,
        type: "poll.reopened",
        data: { poll: pollPayload("open") },
      };
    case "poll_scheduled":
      return {
        ...base,
        type: "poll.scheduled",
        data: {
          poll: pollPayload("scheduled"),
          option: toOptionPayload(poll.kind, {
            id: event.optionId,
            start: event.payload.start,
            duration: event.payload.duration,
          }),
        },
      };
    default:
      return null;
  }
}

function parseIPv4(address: string) {
  const parts = address.split(".");
  if (parts.length !== 4) {
    return null;
  }
  const octets = parts.map((part) =>
    /^\d{1,3}$/.test(part) ? Number(part) : Number.NaN,
  );
  return octets.every((octet) => octet <= 255) ? octets : null;
}

function isPrivateIPv4([a, b]: number[]) {
  return (
    a === 0 || // "this" network, includes 0.0.0.0
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224 // multicast and reserved, includes broadcast
  );
}

/** Expands an IPv6 literal into eight 16-bit groups, or null if malformed. */
function parseIPv6(address: string) {
  let value = address;
  // IPv4-mapped / compatible tail, e.g. ::ffff:10.0.0.1
  const lastColon = value.lastIndexOf(":");
  const tail = value.slice(lastColon + 1);
  if (tail.includes(".")) {
    const octets = parseIPv4(tail);
    if (!octets) {
      return null;
    }
    const [a, b, c, d] = octets;
    value = `${value.slice(0, lastColon)}:${(((a as number) << 8) | (b as number)).toString(16)}:${(((c as number) << 8) | (d as number)).toString(16)}`;
  }

  const halves = value.split("::");
  if (halves.length > 2) {
    return null;
  }
  const toGroups = (part: string) =>
    part === ""
      ? []
      : part.split(":").map((group) => Number.parseInt(group, 16));
  const head = toGroups(halves[0] ?? "");
  const tailGroups = halves.length === 2 ? toGroups(halves[1] ?? "") : [];
  const missing = 8 - head.length - tailGroups.length;
  if (missing < 0 || (halves.length === 1 && missing !== 0)) {
    return null;
  }
  const groups = [...head, ...new Array(missing).fill(0), ...tailGroups];
  return groups.every((group) => Number.isInteger(group) && group <= 0xffff)
    ? groups
    : null;
}

function isPrivateIPv6(groups: number[]) {
  const [g0 = 0, g1 = 0, g2 = 0, g3 = 0, g4 = 0, g5 = 0, g6 = 0, g7 = 0] =
    groups;
  const leadingZero = g0 === 0 && g1 === 0 && g2 === 0 && g3 === 0 && g4 === 0;
  if (leadingZero && g5 === 0xffff) {
    return isPrivateIPv4([g6 >> 8, g6 & 0xff, g7 >> 8, g7 & 0xff]);
  }
  if (leadingZero && g5 === 0 && g6 === 0 && g7 <= 1) {
    return true; // unspecified (::) and loopback (::1)
  }
  return (
    (g0 & 0xffc0) === 0xfe80 || // link-local
    (g0 & 0xfe00) === 0xfc00 // unique local
  );
}

/**
 * Whether an IP literal points at a network a webhook must never reach:
 * loopback, link-local (including the cloud metadata endpoint), RFC 1918 and
 * their IPv6 counterparts. Pure so it can run in the browser for form
 * validation as well as on the server after DNS resolution.
 */
export function isPrivateAddress(address: string) {
  const ipv4 = parseIPv4(address);
  if (ipv4) {
    return isPrivateIPv4(ipv4);
  }
  const ipv6 = parseIPv6(address);
  if (ipv6) {
    return isPrivateIPv6(ipv6);
  }
  return false;
}

export type WebhookUrlRejection =
  | "insecure_scheme"
  | "credentials"
  | "private_host";

/**
 * Why a parsed URL is not an acceptable webhook target, or null if it is.
 * Only IP literals can be judged here; a hostname that resolves to a private
 * address is caught by the sender after DNS resolution.
 */
export function getWebhookUrlRejection(url: URL): WebhookUrlRejection | null {
  if (url.protocol !== "https:") {
    return "insecure_scheme";
  }
  if (url.username || url.password) {
    return "credentials";
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    isPrivateAddress(hostname)
  ) {
    return "private_host";
  }
  return null;
}
