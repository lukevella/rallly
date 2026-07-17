import { PostHog } from "@rallly/posthog/server";
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
