"use client";

import { authClient } from "@/lib/auth-client";

// Fires /get-session on mount (and on tab focus, via better-auth defaults)
// so the cookieCache Set-Cookie reaches the browser. Without this, the
// session_data cookie only ever propagates at sign-in and every request
// past its 5-min lifetime falls back to a DB lookup.
//
// Only mount inside authenticated layouts — using this on public layouts
// would trigger a /get-session call for every anonymous poll viewer.
export function SessionRefresher() {
  authClient.useSession();
  return null;
}
