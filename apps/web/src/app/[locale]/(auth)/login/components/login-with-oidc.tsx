"use client";
import { Button } from "@rallly/ui/button";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

import { Trans } from "@/components/trans";

export async function LoginWithOIDC({ name }: { name: string }) {
  const searchParams = useSearchParams();
  return (
    <Button
      onClick={() => {
        signIn("oidc", {
          redirectTo: searchParams?.get("redirectTo") ?? undefined,
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
