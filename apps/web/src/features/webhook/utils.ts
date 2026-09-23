import { pollActivitySchema } from "@/features/activity/schema";
import {
  MAX_CONSECUTIVE_FAILURES,
  RETRY_DELAYS_MS,
  WEBHOOK_VERSION,
} from "./constants";
import type {
  WebhookEvent,
  WebhookEventType,
  WebhookPingEvent,
} from "./schema";

/**
 * The resource half of an event name (`poll` in `poll.closed`). Event names
 * are `<resource>.<transition>` by construction, so the grouping the picker
 * renders falls out of the name and a new resource needs no second list.
 */
export type WebhookEventResource =
  WebhookEventType extends `${infer R}.${string}` ? R : never;

export function getWebhookEventResource(eventType: WebhookEventType) {
  return eventType.split(".")[0] as WebhookEventResource;
}

/**
 * Event types bucketed by resource, each bucket keeping the order of the
 * source list so the picker is stable.
 */
export function groupWebhookEventTypes(
  eventTypes: readonly WebhookEventType[],
) {
  const groups = new Map<WebhookEventResource, WebhookEventType[]>();
  for (const eventType of eventTypes) {
    const resource = getWebhookEventResource(eventType);
    const group = groups.get(resource);
    if (group) {
      group.push(eventType);
    } else {
      groups.set(resource, [eventType]);
    }
  }
  return [...groups];
}

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

/**
 * Activity type to public event name. The activity log is internal and its
 * `type` column carries history, so the mapping is the seam: an activity is
 * never renamed to match its event, and the event name is the contract.
 * Participant events take three segments so the picker, which groups on the
 * first, files them under the poll.
 */
const ACTIVITY_EVENTS: Record<string, WebhookEventType> = {
  poll_created: "poll.created",
  poll_updated: "poll.updated",
  poll_closed: "poll.closed",
  poll_reopened: "poll.reopened",
  poll_scheduled: "poll.scheduled",
  poll_deleted: "poll.deleted",
  response_created: "poll.participant.created",
  response_updated: "poll.participant.updated",
  response_deleted: "poll.participant.deleted",
};

export const WEBHOOK_ACTIVITY_TYPES = Object.keys(ACTIVITY_EVENTS);

export function toWebhookEventType(activityType: string) {
  return ACTIVITY_EVENTS[activityType] ?? null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

/**
 * An option snapshot as a span of time. All-day options are stored as UTC
 * midnight with a zero duration, so they span their UTC day.
 */
function toTimeRange(
  kind: "date" | "time",
  option: { start: string; duration: number },
) {
  const start = new Date(option.start);
  const allDay = kind === "date";
  const end = new Date(
    start.getTime() + (allDay ? DAY_MS : option.duration * MINUTE_MS),
  );
  return { start: start.toISOString(), end: end.toISOString(), allDay };
}

/**
 * Builds the event envelope for an activity row. The poll is referenced by
 * id only; everything else comes from the activity's own snapshot, so a
 * retried delivery says what happened, not what the poll looks like now.
 * Returns null for activities that are not webhook events or whose payload
 * this version can't interpret.
 */
export function buildWebhookPayload({
  activity,
  poll,
}: {
  activity: {
    id: string;
    type: string;
    participantId: string | null;
    optionId: string | null;
    payload: unknown;
    createdAt: Date;
  };
  poll: {
    id: string;
    kind: "date" | "time";
  };
}): WebhookEvent | null {
  // Every subject ref the vocabulary can require is passed: a missing one
  // fails the parse and the event is dropped without a trace.
  const parsed = pollActivitySchema.safeParse({
    type: activity.type,
    userId: null,
    participantId: activity.participantId ?? undefined,
    optionId: activity.optionId ?? undefined,
    payload: activity.payload,
  });

  if (!parsed.success) {
    return null;
  }

  const event = parsed.data;
  const base = {
    version: WEBHOOK_VERSION,
    id: activity.id,
    createdAt: activity.createdAt.toISOString(),
  };
  const pollRef = { id: poll.id };
  const participantRef = (participantId: string) => ({ id: participantId });

  switch (event.type) {
    case "poll_created":
      return {
        ...base,
        type: "poll.created",
        data: { poll: pollRef },
      };
    case "poll_updated":
      return {
        ...base,
        type: "poll.updated",
        data: { poll: pollRef },
      };
    case "poll_deleted":
      return {
        ...base,
        type: "poll.deleted",
        data: { poll: pollRef },
      };
    case "response_created":
      return {
        ...base,
        type: "poll.participant.created",
        data: {
          poll: pollRef,
          participant: participantRef(event.participantId),
        },
      };
    case "response_updated":
      return {
        ...base,
        type: "poll.participant.updated",
        data: {
          poll: pollRef,
          participant: participantRef(event.participantId),
        },
      };
    case "response_deleted":
      return {
        ...base,
        type: "poll.participant.deleted",
        data: {
          poll: pollRef,
          participant: participantRef(event.participantId),
        },
      };
    case "poll_closed":
      return {
        ...base,
        type: "poll.closed",
        data: { poll: pollRef, reason: event.payload.reason },
      };
    case "poll_reopened":
      return {
        ...base,
        type: "poll.reopened",
        data: { poll: pollRef },
      };
    case "poll_scheduled":
      return {
        ...base,
        type: "poll.scheduled",
        data: {
          poll: pollRef,
          event: toTimeRange(poll.kind, event.payload),
        },
      };
    default:
      return null;
  }
}

/** The body of a test event: the shared envelope and nothing else. */
export function buildWebhookTestPayload({
  id,
  createdAt,
}: {
  id: string;
  createdAt: Date;
}): WebhookPingEvent {
  return {
    version: WEBHOOK_VERSION,
    id,
    type: "ping",
    createdAt: createdAt.toISOString(),
    data: {},
  };
}

export type WebhookHealth =
  | "healthy"
  | "failing"
  | "disabled_after_failures"
  | "disabled"
  | "idle";

/**
 * An endpoint's state as the settings list presents it. Disabled by the
 * dispatcher and disabled by the owner share `enabled: false`; they are told
 * apart by the failure count, which only the dispatcher raises to the cap and
 * which re-enabling clears. Failing is either signal: exhausted events count
 * against the endpoint, but exhaustion takes the whole retry schedule, so a
 * receiver that has been down for hours shows up first as a failed attempt.
 */
export function getWebhookHealth({
  enabled,
  consecutiveFailures,
  lastAttempt,
}: {
  enabled: boolean;
  consecutiveFailures: number;
  lastAttempt?: { status: string };
}): WebhookHealth {
  if (!enabled) {
    return consecutiveFailures >= MAX_CONSECUTIVE_FAILURES
      ? "disabled_after_failures"
      : "disabled";
  }
  if (
    consecutiveFailures > 0 ||
    lastAttempt?.status === "failed" ||
    lastAttempt?.status === "exhausted"
  ) {
    return "failing";
  }
  return lastAttempt ? "healthy" : "idle";
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

/**
 * Every IPv4 range the IANA special-purpose registry marks as not globally
 * reachable, so a webhook can never be pointed at anything a deployment's
 * network might route internally.
 */
function isPrivateIPv4([a = 0, b = 0, c = 0]: number[]) {
  return (
    a === 0 || // "this" network, includes 0.0.0.0
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) || // IETF protocol assignments
    (a === 192 && b === 0 && c === 2) || // TEST-NET-1
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) || // benchmarking
    (a === 198 && b === 51 && c === 100) || // TEST-NET-2
    (a === 203 && b === 0 && c === 113) || // TEST-NET-3
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
