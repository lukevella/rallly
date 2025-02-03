"use client";
import { Button } from "@rallly/ui/button";
import { signIn } from "next-auth/react";

import { Trans } from "@/components/trans";

export async function LoginWithOIDC({
  name,
  callbackUrl,
}: {
  name: string;
  callbackUrl?: string;
}) {
  return (
    <Button
      onClick={() => {
        signIn("oidc", {
          callbackUrl,
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
