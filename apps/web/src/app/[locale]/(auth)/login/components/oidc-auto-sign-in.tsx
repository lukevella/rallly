"use client";

import { useSearchParams } from "next/navigation";
import React from "react";
import { Spinner } from "@/components/spinner";
import { Trans } from "@/i18n/client";
import { authClient } from "@/lib/auth-client";
import { validateRedirectUrl } from "@/utils/redirect";
import { AuthErrors } from "./auth-errors";

export function OIDCAutoSignIn() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const error = searchParams.get("error");

  React.useEffect(() => {
    if (!error) {
      authClient.signIn.oauth2({
        providerId: "oidc",
        callbackURL: validateRedirectUrl(redirectTo) || "/",
        errorCallbackURL: "/login?error=OAuthSignInFailed",
      });
    }
  }, [error, redirectTo]);

  if (error) {
    return <AuthErrors />;
  }

  return (
    <div className="flex h-dvh items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-center">
        <Spinner />
        <div className="text-muted-foreground text-sm">
          <Trans
            i18nKey="oidcAutoSignInDescription"
            defaults="You are being redirected to the login page..."
          />
        </div>
      </div>
    </div>
  );
}
