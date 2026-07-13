import { createLogger } from "@rallly/logger";
import type { BetterAuthPlugin } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { parseSetCookieHeader } from "better-auth/cookies";
import { env } from "@/env";
import { hasDuplicateCookie } from "./has-duplicate-cookie";

const logger = createLogger("auth");

// Deletes the host-only variants of better-auth's session cookies left over
// from before cross-subdomain mode was enabled. Must be registered *after*
// the anonymous plugin so its after-hook runs second — the anonymous plugin
// detects new sessions by parsing Set-Cookie into a name-keyed map, and
// running our deletion last keeps that lookup pointing at the real session
// token rather than our empty placeholder.
export const hostOnlyCookieCleanup: BetterAuthPlugin = {
  id: "host-only-cookie-cleanup",
  hooks: {
    after: [
      {
        matcher: () => !!env.NEXT_PUBLIC_COOKIE_DOMAIN,
        handler: createAuthMiddleware(async (ctx) => {
          // /sign-out always cleans up. For every other path, clean up
          // when a real session token landed in the response — covers
          // sign-in, sign-up, OAuth callbacks, OTP verify, and periodic
          // session refresh — or when the request itself proves a
          // host-only leftover is shadowing the domain cookie (the same
          // session token name appears twice in the Cookie header). The
          // latter heals stuck users on any better-auth traffic instead
          // of waiting for a sign-in they may never complete: a
          // Set-Cookie carrying the domain attribute can never clear a
          // host-only cookie, so without this the shadow wins every
          // read until it expires.
          if (ctx.path !== "/sign-out") {
            const setCookie = ctx.context.responseHeaders?.get("set-cookie");
            const sessionTokenName = ctx.context.authCookies.sessionToken.name;
            const newToken = parseSetCookieHeader(setCookie ?? "")
              .get(sessionTokenName)
              ?.value.split(".")[0];
            const hasShadowedSessionToken = hasDuplicateCookie(
              ctx.headers?.get("cookie") ?? "",
              sessionTokenName,
            );
            if (!newToken && !hasShadowedSessionToken) return;
            if (!newToken) {
              // Observability for the healing path: how often shadowed
              // cookies are still out there. No token values logged.
              logger.info(
                { path: ctx.path },
                "Clearing shadowed host-only session cookies",
              );
            }
          }
          for (const cookie of [
            ctx.context.authCookies.sessionToken,
            ctx.context.authCookies.sessionData,
          ]) {
            const { domain: _, ...attributes } = cookie.attributes;
            ctx.setCookie(cookie.name, "", { ...attributes, maxAge: 0 });
          }
        }),
      },
    ],
  },
};
