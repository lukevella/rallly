import type { PostHogConfig } from "posthog-js";

/**
 * Persistence and identity options for the browser client. Nothing is ever
 * stored on the device, so no consent banner is needed under ePrivacy:
 *
 * - A logged-in user is bootstrapped as already identified. The first event
 *   carries their user id, so no anonymous id is minted and no merge runs —
 *   every anonymous id that gets merged would otherwise be appended to the
 *   person's distinct ids forever, one per page load.
 * - Anyone else captures cookielessly: the client sends a sentinel id and the
 *   server substitutes a daily-rotating hash of IP+UA. Requires "Cookieless
 *   server hash mode" in PostHog project settings. identify() is unavailable
 *   in this mode, which is why the identified branch bootstraps at init
 *   instead of identifying after the fact.
 *
 * Person profiles stay identified-only in both branches. Never call
 * posthog.group() from the browser: registering a group turns person
 * processing on for whatever distinct id is current, identified or not,
 * which is how cookieless visitors ended up with a fresh empty person per
 * day. Group membership is attached server-side by track() and identifyGroup.
 */
export function getPostHogInitOptions({
  distinctId,
}: {
  distinctId?: string;
}): Partial<PostHogConfig> {
  const identity: Partial<PostHogConfig> = distinctId
    ? {
        persistence: "memory",
        bootstrap: { distinctID: distinctId, isIdentifiedID: true },
      }
    : { cookieless_mode: "always" };

  return {
    person_profiles: "identified_only",
    ...identity,
  };
}
