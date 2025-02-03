import { Button } from "@rallly/ui/button";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Trans } from "react-i18next/TransWithoutContext";

import { getTranslation } from "@/i18n/server";

export async function LoginWithOIDC({ name }: { name: string }) {
  const { t } = await getTranslation();
  const searchParams = useSearchParams();
  return (
    <Button
      onClick={() => {
        signIn("oidc", {
          callbackUrl: searchParams?.get("callbackUrl") ?? undefined,
        });
      }}
      variant="link"
    >
      <Trans
        t={t}
        i18nKey="continueWithProvider"
        ns="app"
        defaultValue="Login with {provider}"
        values={{ provider: name }}
      />
    </Button>
  );
}
