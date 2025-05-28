"use client";
import { Button } from "@rallly/ui/button";
import { signIn } from "next-auth/react";

import { Trans } from "@/components/trans";

export function LoginWithOIDC({
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
      className="w-full"
      size="lg"
    >
      <Trans
        i18nKey="continueWithProvider"
        defaults="Continue with {provider}"
        values={{ provider: name }}
      />
    </Button>
  );
}
