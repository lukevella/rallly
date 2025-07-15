"use client";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { UserIcon } from "lucide-react";
import Image from "next/image";
import { signIn } from "next-auth/react";

import { Trans } from "@/components/trans";
import { useTranslation } from "@/i18n/client";

function SSOImage({ provider }: { provider: string }) {
  if (provider === "google") {
    return (
      <Image src="/static/google.svg" width={16} alt="Google" height={16} />
    );
  }

  if (provider === "microsoft-entra-id") {
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
  redirectTo,
}: {
  providerId: string;
  name: string;
  redirectTo?: string;
}) {
  const { t } = useTranslation();
  return (
    <Button
      size="lg"
      aria-label={t("continueWithProvider", {
        provider: name,
        ns: "app",
        defaultValue: "Continue with {provider}",
      })}
      key={providerId}
      onClick={() => {
        signIn(providerId, {
          redirectTo,
        });
      }}
    >
      <SSOImage provider={providerId} />
      <span>
        <Trans
          i18nKey="continueWithProvider"
          defaults="Continue with {provider}"
          values={{ provider: name }}
        />
      </span>
    </Button>
  );
}
