"use client";

import { buttonVariants } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import Link from "next/link";
import React from "react";
import { Trans } from "@/i18n/client";
import { signOut } from "@/lib/auth-client";
import { validateRedirectUrl } from "@/lib/utils/redirect";
import {
  AuthPageContainer,
  AuthPageContent,
  AuthPageDescription,
  AuthPageHeader,
  AuthPageTitle,
} from "./auth-page";

/**
 * Shown on /login instead of redirecting when a session already exists.
 * The redirect used to be automatic, which made /login one leg of the
 * / ↔ /login redirect loop (RAL-1313) — a loop needs two automated legs,
 * so the user must click to continue. The sign out button is the escape
 * hatch when the session only looks alive (stale cookie cache).
 */
export function AlreadyLoggedIn({ redirectTo }: { redirectTo?: string }) {
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  return (
    <AuthPageContainer>
      <AuthPageHeader>
        <AuthPageTitle>
          <Trans
            i18nKey="alreadyLoggedInTitle"
            defaults="You're already signed in"
          />
        </AuthPageTitle>
        <AuthPageDescription>
          <Trans
            i18nKey="alreadyLoggedInDescription"
            defaults="Continue to your dashboard or sign out to use a different account."
          />
        </AuthPageDescription>
      </AuthPageHeader>
      <AuthPageContent>
        <div className="grid gap-3">
          <Link
            className={buttonVariants({ variant: "primary", size: "xl" })}
            href={validateRedirectUrl(redirectTo) ?? "/"}
          >
            <Trans i18nKey="alreadyLoggedInContinue" defaults="Continue" />
          </Link>
          <Button
            size="xl"
            loading={isSigningOut}
            onClick={() => {
              setIsSigningOut(true);
              signOut().finally(() => {
                window.location.reload();
              });
            }}
          >
            <Trans i18nKey="signOut" defaults="Sign Out" />
          </Button>
        </div>
      </AuthPageContent>
    </AuthPageContainer>
  );
}
