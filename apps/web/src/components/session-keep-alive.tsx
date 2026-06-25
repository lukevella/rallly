"use client";

import { authClient } from "@/lib/auth-client";

// Fires /get-session on mount (and on tab focus, via better-auth defaults) so
// the cookieCache Set-Cookie reaches the browser and the session's sliding
// expiry keeps advancing while the user is active. Mounted by SessionRefresher
// only once a session is known to exist.
export function SessionKeepAlive() {
  authClient.useSession();
  return null;
}
