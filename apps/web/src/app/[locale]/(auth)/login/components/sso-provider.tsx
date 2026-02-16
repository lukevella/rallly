"use client";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { UserIcon } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

import { Trans, useTranslation } from "@/i18n/client";
import { authClient } from "@/lib/auth-client";
import { validateRedirectUrl } from "@/utils/redirect";

function SSOImage({ provider }: { provider: string }) {
  if (provider === "google") {
    return (
      <Image src="/static/google.svg" width={16} alt="Google" height={16} />
    );
  }

  if (provider === "microsoft-entra-id" || provider === "microsoft") {
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
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
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
        authClient.signIn.social({
          provider: providerId,
          callbackURL: validateRedirectUrl(redirectTo) || "/",
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
