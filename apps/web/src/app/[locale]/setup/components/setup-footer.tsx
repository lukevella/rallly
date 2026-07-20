"use client";

import { Button } from "@rallly/ui/button";
import React from "react";
import { Trans } from "@/i18n/client";
import { signOut } from "@/lib/auth-client";

export function SetupFooter({ email }: { email: string }) {
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  return (
    <p className="flex flex-col items-center gap-4 text-muted-foreground text-sm">
      <span>
        <Trans
          i18nKey="setupFooterLoggedInAs"
          defaults="Logged in as <email>{email}</email>"
          values={{ email }}
          components={{
            email: <span className="font-medium text-foreground" />,
          }}
        />
      </span>
      <Button
        variant="ghost"
        size="sm"
        loading={isSigningOut}
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
        <Trans i18nKey="signOut" defaults="Sign out" />
      </Button>
    </p>
  );
}
