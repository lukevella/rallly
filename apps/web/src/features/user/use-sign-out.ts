"use client";

import { usePostHog } from "@rallly/posthog/client";
import React from "react";
import { authClient } from "@/lib/auth-client";

// Tears down the session and analytics identity. Navigation is the caller's
// concern — handle it after awaiting.
export function useSignOut() {
  const posthog = usePostHog();

  return React.useCallback(async () => {
    await authClient.signOut();
    posthog?.reset();
  }, [posthog]);
}
