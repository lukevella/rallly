import { posthog } from "@rallly/posthog/client";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import {
  anonymousClient,
  emailOTPClient,
  genericOAuthClient,
  inferAdditionalFields,
  lastLoginMethodClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { Auth } from "@/lib/auth";

export const authClient = createAuthClient({
  baseURL: absoluteUrl("/api/better-auth"),
  plugins: [
    inferAdditionalFields<Auth>(),
    emailOTPClient(),
    genericOAuthClient(),
    lastLoginMethodClient(),
    anonymousClient(),
  ],
});

const signOutListeners = new Set<() => void>();

/**
 * Runs after the session is revoked. The tRPC provider uses this to drop
 * its query cache: the client outlives a sign-out, and cached responses
 * carry data the next person at this browser must not see (host-only
 * notes, un-hidden participants, response edit links).
 */
export function onSignOut(listener: () => void) {
  signOutListeners.add(listener);
  return () => {
    signOutListeners.delete(listener);
  };
}

export async function signOut() {
  await authClient.signOut();
  posthog?.reset();
  for (const listener of signOutListeners) {
    listener();
  }
}
