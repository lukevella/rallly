"use client";

import { Button } from "@rallly/ui/button";
import React from "react";
import { Trans } from "@/i18n/client";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  return (
    <Button
      size="xl"
      loading={isSigningOut}
      onClick={() => {
        setIsSigningOut(true);
        signOut()
          .catch(() => {
            // Reload even if sign out fails: the server re-renders from
            // the real cookie state, so the user sees this page again
            // instead of a stuck spinner or an unhandled rejection.
          })
          .finally(() => {
            window.location.reload();
          });
      }}
    >
      <Trans i18nKey="signOut" defaults="Sign Out" />
    </Button>
  );
}
