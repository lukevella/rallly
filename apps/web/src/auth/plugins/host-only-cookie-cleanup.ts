import type { BetterAuthPlugin } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { parseSetCookieHeader } from "better-auth/cookies";
import { env } from "@/env";

// Paths where better-auth either mints a new session cookie or clears the
// existing one. The cleanup only runs on these.
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
          // /sign-out always cleans up. For every other path, only clean
          // up when a real session token actually landed in the response
          // — covers sign-in, sign-up, OAuth callbacks, OTP verify, and
          // periodic session refresh, while skipping failed logins, OTP
          // sends, redirect-only endpoints, and plain session reads.
          if (ctx.path !== "/sign-out") {
            const setCookie = ctx.context.responseHeaders?.get("set-cookie");
            const sessionTokenName = ctx.context.authCookies.sessionToken.name;
            const newToken = parseSetCookieHeader(setCookie ?? "")
              .get(sessionTokenName)
              ?.value.split(".")[0];
            if (!newToken) return;
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
