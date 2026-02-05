"use client";

import { useSearchParams } from "next/navigation";
import useMount from "react-use/lib/useMount";
import { Spinner } from "@/components/spinner";
import { Trans } from "@/components/trans";
import { authClient } from "@/lib/auth-client";
import { validateRedirectUrl } from "@/utils/redirect";

import { prepareGuestMerge } from "../actions";

export function OIDCAutoSignIn() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  useMount(async () => {
    // Capture guest ID before SSO redirect (best-effort, don't block login)
    await prepareGuestMerge().catch(() => null);
    authClient.signIn.oauth2({
      providerId: "oidc",
      callbackURL: validateRedirectUrl(redirectTo) || "/",
      errorCallbackURL: "/login?error=OAuthSignInFailed",
    });
  });

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
