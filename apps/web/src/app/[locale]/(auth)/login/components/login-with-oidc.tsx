"use client";
import { Button } from "@rallly/ui/button";
import { useSearchParams } from "next/navigation";

import { Trans } from "@/i18n/client";
import { authClient } from "@/lib/auth-client";
import { validateRedirectUrl } from "@/utils/redirect";

export function LoginWithOIDC({ name }: { name: string }) {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
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
