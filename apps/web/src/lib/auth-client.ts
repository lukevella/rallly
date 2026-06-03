import { absoluteUrl } from "@rallly/utils/absolute-url";
import {
  anonymousClient,
  emailOTPClient,
  genericOAuthClient,
  inferAdditionalFields,
  lastLoginMethodClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { env } from "@/env";
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

export async function signOut() {
  await authClient.signOut();
  // Rallly is federated into the Wanaku Suite — sign-out is a suite-wide intent,
  // so bounce to the portal login rather than Rallly's own /login.
  window.location.href = `${env.NEXT_PUBLIC_PORTAL_URL}/login`;
}
