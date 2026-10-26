"use client";

import { useSearchParams } from "next/navigation";
import { LoginWithOIDC } from "@/features/auth/components/login-with-oidc";
import { Trans } from "@/i18n/client";

export function OidcSignInPrompt({
  providerName,
  redirectTo,
}: {
  providerName: string;
  redirectTo: string;
}) {
  // The emailed link carries the response's edit token (or invite token) in
  // the query string; dropping it would unlink the response after sign-in.
  const search = useSearchParams().toString();
  const target = search ? `${redirectTo}?${search}` : redirectTo;

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <p className="text-sm">
        <Trans
          i18nKey="oidcSignInToVote"
          defaults="Sign in with your organization account to vote on this poll."
        />
      </p>
      <LoginWithOIDC name={providerName} redirectTo={target} />
    </div>
  );
}
