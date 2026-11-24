"use client";
import { Button } from "@rallly/ui/button";
import { UserIcon } from "lucide-react";
import Image from "next/image";
import { LastUsedBadge } from "@/features/auth/components/last-used-badge";

import { authClient } from "@/lib/auth-client";
import { validateRedirectUrl } from "@/lib/utils/redirect";

function SSOImage({ provider }: { provider: string }) {
  if (provider === "google") {
    return (
      <Image
        src="/static/google.svg"
        width={16}
        alt=""
        height={16}
        unoptimized
      />
    );
  }

  if (provider === "microsoft-entra-id" || provider === "microsoft") {
    return (
      <Image
        src="/static/microsoft.svg"
        width={16}
        alt=""
        height={16}
        unoptimized
      />
    );
  }

  if (provider === "oidc") {
    return <UserIcon className="text-muted-foreground" />;
  }

  return null;
}

export function SSOProvider({
  providerId,
  name,
  redirectTo,
  isLastUsed,
}: {
  providerId: string;
  name: string;
  redirectTo?: string;
  isLastUsed?: boolean;
}) {
  return (
    <Button
      size="xl"
      className="relative"
      key={providerId}
      onClick={() => {
        authClient.signIn.social({
          provider: providerId,
          callbackURL: validateRedirectUrl(redirectTo) || "/",
          errorCallbackURL: "/login",
        });
      }}
    >
      <SSOImage provider={providerId} />
      <span>{name}</span>
      {isLastUsed ? <LastUsedBadge /> : null}
    </Button>
  );
}
