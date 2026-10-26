"use client";

import { LoginWithOIDC } from "@/features/auth/components/login-with-oidc";
import { Trans } from "@/i18n/client";

export function OidcSignInPrompt({
  providerName,
  redirectTo,
}: {
  providerName: string;
  redirectTo: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <p className="text-sm">
        <Trans
          i18nKey="oidcSignInToVote"
          defaults="Sign in with your organization account to vote on this poll."
        />
      </p>
      <LoginWithOIDC name={providerName} redirectTo={redirectTo} />
    </div>
  );
}
