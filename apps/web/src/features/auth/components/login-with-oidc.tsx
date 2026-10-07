"use client";
import { Button } from "@rallly/ui/button";

import { LastUsedBadge } from "@/features/auth/components/last-used-badge";
import { authClient } from "@/lib/auth-client";
import { validateRedirectUrl } from "@/lib/utils/redirect";

export function LoginWithOIDC({
  name,
  redirectTo,
  isLastUsed,
}: {
  name: string;
  redirectTo?: string;
  isLastUsed?: boolean;
}) {
  return (
    <Button
      onClick={() => {
        authClient.signIn.oauth2({
          providerId: "oidc",
          callbackURL: validateRedirectUrl(redirectTo) || "/",
          errorCallbackURL: "/login",
        });
      }}
      className="relative w-full"
      size="xl"
    >
      {name}
      {isLastUsed ? <LastUsedBadge /> : null}
    </Button>
  );
}
