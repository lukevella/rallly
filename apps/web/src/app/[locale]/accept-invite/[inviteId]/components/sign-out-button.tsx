"use client";

import { Button } from "@rallly/ui/button";
import React from "react";
import { Trans } from "@/components/trans";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const [isPending, setIsPending] = React.useState(false);
  return (
    <Button
      variant="link"
      loading={isPending}
      onClick={async () => {
        setIsPending(true);
        await signOut();
      }}
    >
      <Trans
        i18nKey="loginWithAnotherAccount"
        defaults="Login with another account"
      />
    </Button>
  );
}
