import type { PostHogConfig } from "posthog-js";

/**
 * Persistence options for the browser client. The anonymous id lives in a
 * cookie scoped to the registrable domain, so a visitor keeps one id from
 * rallly.co through to app.rallly.co. When they sign in, initPostHog
 * identifies them, which merges that anonymous id (and every marketing
 * pageview on it) into their person.
 *
 * Person profiles stay identified-only: anonymous visitors never get a
 * person until they sign in. Never call posthog.group() from the browser:
 * registering a group turns person processing on for whatever distinct id is
 * current, identified or not, which mints an empty person per visitor. Group
 * membership is attached server-side by track() and identifyGroup.
 */
export function getPostHogInitOptions(): Partial<PostHogConfig> {
  return {
    person_profiles: "identified_only",
    persistence: "localStorage+cookie",
    cross_subdomain_cookie: true,
    // localStorage is per origin, so rallly.co and app.rallly.co each keep a
    // copy that goes stale when the other signs in or out. The shared cookie
    // is the one source both see.
    cookieWinsOnConflict: true,
  };
}
