"use client";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { UserIcon } from "lucide-react";
import Image from "next/image";

import { authClient } from "@/lib/auth-client";
import { validateRedirectUrl } from "@/lib/utils/redirect";

function SSOImage({ provider }: { provider: string }) {
  if (provider === "google") {
    return <Image src="/static/google.svg" width={16} alt="" height={16} />;
  }

  if (provider === "microsoft-entra-id" || provider === "microsoft") {
    return <Image src="/static/microsoft.svg" width={16} alt="" height={16} />;
  }

  if (provider === "oidc") {
    return (
      <Icon>
        <UserIcon />
      </Icon>
    );
  }

  return null;
}

export function SSOProvider({
  providerId,
  name,
  redirectTo,
}: {
  providerId: string;
  name: string;
  redirectTo?: string;
}) {
  return (
    <Button
      size="xl"
      key={providerId}
      onClick={() => {
        authClient.signIn.social({
          provider: providerId,
          callbackURL: validateRedirectUrl(redirectTo) || "/",
        });
      }}
    >
      <SSOImage provider={providerId} />
      <span>{name}</span>
    </Button>
  );
}
