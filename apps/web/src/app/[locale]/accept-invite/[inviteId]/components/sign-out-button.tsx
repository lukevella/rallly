"use client";

import { Button } from "@rallly/ui/button";
import { useRouter } from "next/navigation";
import React from "react";
import { Trans } from "@/i18n/client";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);
  return (
    <Button
      variant="link"
      loading={isPending}
      onClick={async () => {
        setIsPending(true);
        try {
          await signOut();
          router.refresh();
        } finally {
          setIsPending(false);
        }
      }}
    >
      <Trans
        i18nKey="loginWithAnotherAccount"
        defaults="Login with another account"
      />
    </Button>
  );
}
