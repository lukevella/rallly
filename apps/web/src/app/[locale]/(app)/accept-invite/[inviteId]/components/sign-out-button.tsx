"use client";

import { usePostHog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import React from "react";
import { Trans } from "@/i18n/client";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const [isPending, setIsPending] = React.useState(false);
  const posthog = usePostHog();
  return (
    <Button
      variant="link"
      loading={isPending}
      onClick={async () => {
        setIsPending(true);
        await signOut();
        posthog?.reset();
      }}
    >
      <Trans
        i18nKey="loginWithAnotherAccount"
        defaults="Login with another account"
      />
    </Button>
  );
}
