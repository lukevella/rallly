"use client";

import { Button } from "@rallly/ui/button";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import React from "react";
import { Trans } from "@/components/trans";

export function SignOutButton() {
  const pathname = usePathname();
  const [isPending, startTransition] = React.useTransition();
  return (
    <Button
      variant="link"
      loading={isPending}
      onClick={() =>
        startTransition(
          async () =>
            await signOut({
              redirectTo: pathname,
            }),
        )
      }
    >
      <Trans
        i18nKey="loginWithAnotherAccount"
        defaults="Login with another account"
      />
    </Button>
  );
}
