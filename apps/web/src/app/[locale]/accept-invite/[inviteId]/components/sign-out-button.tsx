"use client";

import { Button } from "@rallly/ui/button";
import React from "react";
import { useSignOut } from "@/features/user/use-sign-out";
import { Trans } from "@/i18n/client";

export function SignOutButton() {
  const [isPending, setIsPending] = React.useState(false);
  const signOut = useSignOut();
  return (
    <Button
      variant="link"
      loading={isPending}
      onClick={async () => {
        setIsPending(true);
        await signOut();
        window.location.href = "/login";
      }}
    >
      <Trans
        i18nKey="loginWithAnotherAccount"
        defaults="Login with another account"
      />
    </Button>
  );
}
