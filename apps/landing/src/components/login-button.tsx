"use client";

import { usePostHog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import Link from "next/link";
import { Trans } from "@/i18n/client/trans";
import { linkToApp } from "@/lib/linkToApp";

export const LoginButton = () => {
  const posthog = usePostHog();
  return (
    <Button
      variant="ghost"
      onClick={() => {
        posthog.capture("landing:login_button_click");
      }}
      asChild
    >
      <Link href={linkToApp("/login")}>
        <Trans i18nKey="login" defaults="Login" />
      </Link>
    </Button>
  );
};
