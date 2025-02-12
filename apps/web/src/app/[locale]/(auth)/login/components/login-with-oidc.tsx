"use client";
import { Button } from "@rallly/ui/button";
import { signIn } from "next-auth/react";

import { Trans } from "@/components/trans";

export async function LoginWithOIDC({
  name,
  redirectTo,
}: {
  name: string;
  redirectTo?: string;
}) {
  return (
    <Button
      onClick={() => {
        signIn("oidc", {
          redirectTo,
        });
      }}
      variant="link"
    >
      <Trans
        i18nKey="continueWithProvider"
        defaults="Continue with {provider}"
        values={{ provider: name }}
      />
    </Button>
  );
}
