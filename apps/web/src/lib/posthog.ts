import { PostHog } from "@rallly/posthog/server";
import {
  getPostHogCookieName,
  parsePostHogCookieDistinctId,
} from "@rallly/posthog/utils";
import type { NextRequest } from "next/server";
import { after } from "next/server";
import { env } from "@/env";

let instance: PostHog | undefined;

export function posthog() {
  if (!instance && env.NEXT_PUBLIC_POSTHOG_API_KEY) {
    instance = new PostHog(env.NEXT_PUBLIC_POSTHOG_API_KEY, {
      host: env.NEXT_PUBLIC_POSTHOG_API_HOST,
      flushAt: 20,
      flushInterval: 10000,
    });
  }

  return instance;
}

/**
 * Capture a product event attributed to the acting user.
 *
 * This is the only sanctioned way to capture user-attributed events on the
 * server — importing the raw `posthog` client is lint-restricted (see
 * noRestrictedImports in apps/web/biome.json) so the guest decision cannot
 * be forgotten at individual capture sites. Guests are captured as anonymous
 * events (no person profile — they are transient and rarely convert);
 * identified users get person processing as usual. Group analytics is
 * unaffected either way.
 *
 * When a guest's client-side anonymous distinct_id is known (read from the
 * posthog-js persistence cookie via getClientAnonymousDistinctId), guest
 * events adopt it so server events stitch to the same journey as the guest's
 * pageviews. Without it (ad blocker, GPC opt-out, cookie not yet written) we
 * fall back to the guest user id — the event is still captured, just
 * unstitched. Registered users always capture under their user id.
 */
export function track(
  user: { id: string; isGuest: boolean; anonymousDistinctId?: string },
  event: {
    event: string;
    properties?: Record<string, unknown>;
    groups?: Record<string, string>;
  },
) {
  const distinctId =
    user.isGuest && user.anonymousDistinctId
      ? user.anonymousDistinctId
      : user.id;

  posthog()?.capture({
    ...event,
    distinctId,
    properties: {
      ...event.properties,
      $process_person_profile: !user.isGuest,
    },
  });
}

/**
 * Read the client's anonymous distinct_id from the posthog-js persistence
 * cookie (persistence: "cookie"). Absent or malformed cookies yield undefined.
 */
export function getClientAnonymousDistinctId(req: NextRequest) {
  if (!env.NEXT_PUBLIC_POSTHOG_API_KEY) {
    return undefined;
  }

  const cookie = req.cookies.get(
    getPostHogCookieName(env.NEXT_PUBLIC_POSTHOG_API_KEY),
  );

  return parsePostHogCookieDistinctId(cookie?.value) ?? undefined;
}

// Without an explicit distinctId, groupIdentify defaults to
// $<groupType>_<groupKey>, creating a dummy person profile per group
// (PostHog/posthog#7921). A single shared id caps the junk at one person.
// Sending the event personless is not an option — ingestion only applies
// $group_set when person processing is enabled.
const GROUP_IDENTIFY_DISTINCT_ID = "server_group_identify";

/**
 * Update properties on a group (e.g. poll, space). Pass distinctId to
 * attribute the group identify to the acting user; without it the event
 * captures under a shared server id (see above — never a real person, so
 * actor attribution then belongs on the accompanying track() event).
 */
export function identifyGroup(group: {
  groupType: string;
  groupKey: string;
  properties?: Record<string, unknown>;
  distinctId?: string;
}) {
  posthog()?.groupIdentify({
    ...group,
    distinctId: group.distinctId ?? GROUP_IDENTIFY_DISTINCT_ID,
  });
}

// System events report on flows where no person can stay attached — e.g.
// the account deletion reaper erases the very person its event is about —
// so they capture personless under a fixed server distinctId (same
// dummy-person-avoidance trick as group identify above). Never put
// user-identifying properties on these.
const SYSTEM_EVENT_DISTINCT_ID = "server_system_event";

export function trackSystemEvent(event: {
  event: string;
  properties?: Record<string, unknown>;
}) {
  posthog()?.capture({
    ...event,
    distinctId: SYSTEM_EVENT_DISTINCT_ID,
    properties: {
      ...event.properties,
      $process_person_profile: false,
    },
  });
}

/**
 * Flush buffered events before a short-lived invocation (cron) exits —
 * the client batches (flushAt/flushInterval), so a serverless function can
 * freeze before the buffer drains.
 */
export async function flushPostHog() {
  await posthog()?.flush();
}

/**
 * Erase a person from PostHog (profile plus their events) so analytics data
 * keyed to a userId does not outlive the account. PostHog is optional config
 * that can run in any deployment mode, so this guards on configuration
 * presence and no-ops when the personal API key or project id is missing.
 * Reads process.env directly (same pattern as features/billing/service.ts);
 * the personal API key needs the person:write scope.
 */
export async function deletePostHogPerson({
  distinctId,
}: {
  distinctId: string;
}) {
  const personalApiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;

  if (!personalApiKey || !projectId) {
    return;
  }

  const apiHost = process.env.POSTHOG_API_HOST ?? "https://us.posthog.com";
  const headers = { Authorization: `Bearer ${personalApiKey}` };

  const lookupRes = await fetch(
    `${apiHost}/api/projects/${projectId}/persons/?distinct_id=${encodeURIComponent(distinctId)}`,
    { headers, signal: AbortSignal.timeout(10_000) },
  );

  if (!lookupRes.ok) {
    throw new Error(`PostHog person lookup failed: ${lookupRes.status}`);
  }

  const { results } = (await lookupRes.json()) as {
    results?: Array<{ id: string | number }>;
  };
  const person = results?.[0];

  if (!person) {
    return;
  }

  const deleteRes = await fetch(
    `${apiHost}/api/projects/${projectId}/persons/${person.id}/?delete_events=true`,
    { method: "DELETE", headers, signal: AbortSignal.timeout(10_000) },
  );

  if (!deleteRes.ok && deleteRes.status !== 404) {
    throw new Error(`PostHog person deletion failed: ${deleteRes.status}`);
  }
}

export function withPostHog(
  handler: (req: NextRequest) => Promise<Response>,
): (req: NextRequest) => Promise<Response> {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } finally {
      const ph = posthog();
      if (ph) {
        after(() => ph.flush());
      }
    }
  };
}
