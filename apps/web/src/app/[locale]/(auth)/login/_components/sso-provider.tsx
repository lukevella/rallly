"use client";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { UserIcon } from "lucide-react";
import Image from "next/image";
import { signIn } from "next-auth/react";

import { useTranslation } from "@/app/i18n/client";

function SSOImage({ provider }: { provider: string }) {
  if (provider === "google") {
    return (
      <Image src="/static/google.svg" width={16} alt="Google" height={16} />
    );
  }

  if (provider === "azure-ad") {
    return (
      <Image
        src="/static/microsoft.svg"
        width={16}
        alt="Microsoft"
        height={16}
      />
    );
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
}: {
  providerId: string;
  name: string;
}) {
  const { t } = useTranslation("app");
  return (
    <Button
      aria-label={t("continueWithProvider", {
        provider: name,
        ns: "app",
        defaultValue: "Continue with {{provider}}",
      })}
      key={providerId}
      onClick={() => {
        signIn(providerId);
      }}
    >
      <SSOImage provider={providerId} />
      <span>{name}</span>
    </Button>
  );
}
