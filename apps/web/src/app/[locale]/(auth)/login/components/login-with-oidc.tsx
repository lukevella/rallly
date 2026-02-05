"use client";
import { Button } from "@rallly/ui/button";

import { Trans } from "@/components/trans";
import { authClient } from "@/lib/auth-client";
import { validateRedirectUrl } from "@/utils/redirect";

import { prepareGuestMerge } from "../actions";

export function LoginWithOIDC({
  name,
  redirectTo,
}: {
  name: string;
  redirectTo?: string;
}) {
  return (
    <Button
      onClick={async () => {
        // Capture guest ID before SSO redirect (best-effort, don't block login)
        await prepareGuestMerge().catch(() => null);
        authClient.signIn.oauth2({
          providerId: "oidc",
          callbackURL: validateRedirectUrl(redirectTo) || "/",
          errorCallbackURL: "/login?error=OAuthSignInFailed",
        });
      }}
      className="w-full"
      size="lg"
    >
      <Trans
        i18nKey="continueWithProvider"
        defaults="Continue with {provider}"
        values={{ provider: name }}
      />
    </Button>
  );
}
