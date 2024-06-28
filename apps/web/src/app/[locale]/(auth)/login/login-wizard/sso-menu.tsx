"use client";
import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { UserIcon } from "lucide-react";
import Image from "next/image";

import { useLoginWizardProps } from "@/app/[locale]/(auth)/login/login-wizard/login-wizard";
import { Spinner } from "@/components/spinner";
import { Trans } from "@/components/trans";

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

export function SSOMenu() {
  const { providers, onContinueWithOAuth } = useLoginWizardProps();

  if (!providers) {
    return <Spinner />;
  }

  if (providers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-x-2.5">
        <hr className="grow" />
        <div className="text-muted-foreground text-xs uppercase">
          <Trans i18nKey="or" />
        </div>
        <hr className="grow" />
      </div>
      <div className="grid gap-2.5">
        {providers.map((provider) => (
          <Button
            key={provider.id}
            onClick={() => {
              onContinueWithOAuth(provider.id);
            }}
          >
            <SSOImage provider={provider.id} />
            <span className="grow">
              <Trans
                i18nKey="continueWith"
                values={{ provider: provider.name }}
              />
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
