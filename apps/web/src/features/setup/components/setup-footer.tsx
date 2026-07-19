"use client";

import React from "react";
import { Trans } from "@/i18n/client";
import { signOut } from "@/lib/auth-client";

export function SetupFooter({ email }: { email: string }) {
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  return (
    <p className="text-muted-foreground text-sm">
      <Trans
        i18nKey="setupLoggedInAs"
        defaults="Logged in as {email}"
        values={{ email }}
      />{" "}
      <button
        type="button"
        disabled={isSigningOut}
        className="text-link disabled:opacity-50"
        onClick={() => {
          setIsSigningOut(true);
          signOut()
            .catch(() => {
              // Reload even if sign out fails: the server re-renders from
              // the real cookie state.
            })
            .finally(() => {
              window.location.reload();
            });
        }}
      >
        <Trans i18nKey="logout" defaults="Logout" />
      </button>
    </p>
  );
}
