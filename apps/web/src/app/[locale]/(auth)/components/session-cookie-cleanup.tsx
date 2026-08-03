"use client";

import React from "react";
import { authClient } from "@/lib/auth-client";

// A user wedged by a shadowed session cookie bounces between / and the
// "already signed in" interstitial without ever making a better-auth
// request, so the server side host-only-cookie-cleanup healing never gets
// a chance to run — page renders can't write cookies. One get-session
// round trip from the interstitial gives it that chance: when the Cookie
// header carries a duplicate session token the response deletes the
// host-only shadows, and otherwise it's a cheap no-op. Mounted only on
// the interstitial — the one page a wedged user reliably lands on — to
// keep get-session traffic off the ordinary login flow.
export function SessionCookieCleanup() {
  React.useEffect(() => {
    void authClient.getSession();
  }, []);

  return null;
}
