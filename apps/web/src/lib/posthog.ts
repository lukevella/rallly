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

/**
 * Update properties on a group (e.g. poll, space). Groups are independent
 * of person profiles, so no guest handling is involved.
 */
export function identifyGroup(group: {
  groupType: string;
  groupKey: string;
  properties?: Record<string, unknown>;
}) {
  posthog()?.groupIdentify(group);
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
