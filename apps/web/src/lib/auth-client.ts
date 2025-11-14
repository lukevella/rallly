import {
  anonymousClient,
  emailOTPClient,
  genericOAuthClient,
  inferAdditionalFields,
  lastLoginMethodClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { signOut as nextAuthSignOut } from "next-auth/react";
import { env } from "@/env";
import type { Auth } from "@/lib/auth";

export const authClient = createAuthClient({
  baseURL: `${env.NEXT_PUBLIC_BASE_URL}/api/better-auth`,
  plugins: [
    inferAdditionalFields<Auth>(),
    emailOTPClient(),
    genericOAuthClient(),
    lastLoginMethodClient(),
    anonymousClient(),
  ],
});

export async function signOut() {
  await Promise.all([
    authClient.signOut(),
    nextAuthSignOut({ redirect: false }),
  ]);
  window.location.href = "/login";
}
