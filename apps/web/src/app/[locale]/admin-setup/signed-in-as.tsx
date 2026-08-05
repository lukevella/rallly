"use client";

import { Button } from "@rallly/ui/button";
import React from "react";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { Trans } from "@/i18n/client";
import { signOut } from "@/lib/auth-client";

export function SignedInAs({
  name,
  email,
  image,
}: {
  name: string;
  email: string;
  image?: string;
}) {
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm">
      <span className="text-muted-foreground">
        <Trans i18nKey="signedInAs" defaults="You're signed in as:" />
      </span>
      <span className="flex items-center gap-2">
        <OptimizedAvatarImage src={image} name={name} size="sm" />
        <span className="font-medium">{email}</span>
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
    </div>
  );
}
