import { createLogger } from "@rallly/logger";
import { PostHog } from "@rallly/posthog/server";
import type { NextRequest } from "next/server";
import { after } from "next/server";
import { env } from "@/env";

const logger = createLogger("posthog");

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
 * events under their guest user id (no person profile — they are transient
 * and rarely convert); registered users get person processing as usual.
 * Note: PostHog drops group associations on personless events, so `groups`
 * passed here only take effect for identified users — put poll/space/tier on
 * plain properties when guest events need them.
 *
 * The browser client stores nothing on the device (see
 * packages/posthog/src/client-config.ts), so there is no anonymous id to
 * stitch guest server events to; they stand alone.
 */
export function track(
  user: { id: string; isGuest: boolean },
  event: {
    event: string;
    properties?: Record<string, unknown>;
    groups?: Record<string, string>;
  },
) {
  posthog()?.capture({
    ...event,
    distinctId: user.id,
    properties: {
      ...event.properties,
      $process_person_profile: !user.isGuest,
    },
  });
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
 * presence and no-ops when the personal API key or project id is missing —
 * with a warning when analytics is ingesting, since the skipped erasure
 * leaves person data behind. Reads process.env directly (same pattern as
 * features/billing/service.ts); the personal API key needs the person:write
 * scope. POSTHOG_API_HOST is the region app host serving the private
 * management API — not NEXT_PUBLIC_POSTHOG_API_HOST, which is an ingestion
 * host (in production a reverse proxy that does not forward the private API).
 */
export async function deletePostHogPerson({
  distinctId,
}: {
  distinctId: string;
}) {
  const personalApiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;

  if (!personalApiKey || !projectId) {
    if (env.NEXT_PUBLIC_POSTHOG_API_KEY) {
      logger.warn(
        {
          distinctId,
          missingEnvVars: [
            !personalApiKey && "POSTHOG_PERSONAL_API_KEY",
            !projectId && "POSTHOG_PROJECT_ID",
          ].filter(Boolean),
        },
        "PostHog erasure skipped: analytics data will outlive the account",
      );
    }
    return;
  }

  const apiHost = process.env.POSTHOG_API_HOST ?? "https://eu.posthog.com";
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
