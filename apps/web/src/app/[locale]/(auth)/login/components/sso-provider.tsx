"use client";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { UserIcon } from "lucide-react";
import Image from "next/image";

import { Trans } from "@/components/trans";
import { useTranslation } from "@/i18n/client";
import { authClient } from "@/lib/auth-client";
import { validateRedirectUrl } from "@/utils/redirect";

import { prepareGuestMerge } from "../actions";

/**
 * Renders the appropriate SSO provider icon based on the provider ID.
 */
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

/**
 * SSO login button component that initiates social authentication.
 * Captures any existing guest session before redirecting to the SSO provider.
 */
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
      onClick={async () => {
        await prepareGuestMerge();
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
