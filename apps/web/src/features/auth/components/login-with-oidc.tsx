"use client";
import { Button } from "@rallly/ui/button";

import { authClient } from "@/lib/auth-client";
import { validateRedirectUrl } from "@/lib/utils/redirect";

export function LoginWithOIDC({
  name,
  redirectTo,
}: {
  name: string;
  redirectTo?: string;
}) {
  return (
    <Button
      onClick={() => {
        authClient.signIn.oauth2({
          providerId: "oidc",
          callbackURL: validateRedirectUrl(redirectTo) || "/",
          errorCallbackURL: "/login?error=OAuthSignInFailed",
        });
      }}
      className="w-full"
      size="xl"
    >
      {name}
    </Button>
  );
}
