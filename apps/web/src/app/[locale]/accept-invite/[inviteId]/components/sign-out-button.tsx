"use client";

import { Button } from "@rallly/ui/button";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { Trans } from "@/components/trans";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const pathname = usePathname();
  const [isPending, setIsPending] = React.useState(false);
  const router = useRouter();
  return (
    <Button
      variant="link"
      loading={isPending}
      onClick={async () => {
        setIsPending(true);
        await signOut();
        setIsPending(false);
        router.push(pathname);
      }}
    >
      <Trans
        i18nKey="loginWithAnotherAccount"
        defaults="Login with another account"
      />
    </Button>
  );
}
