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

export async function signOut() {
  await authClient.signOut();
  window.location.href = "/login";
}
