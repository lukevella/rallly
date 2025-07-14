"use client";

import { Trans } from "@/i18n/client/trans";
import { linkToApp } from "@/lib/linkToApp";
import { usePostHog } from "@rallly/posthog/client";
import { Button } from "@rallly/ui/button";
import Link from "next/link";

export function SignUpButton() {
  const posthog = usePostHog();
  return (
    <Button
      variant="primary"
      onClick={() => {
        posthog.capture("landing:sign_up_button_click");
      }}
      asChild
    >
      <Link href={linkToApp("/register")}>
        <Trans i18nKey="signUp" defaults="Sign up" />
      </Link>
    </Button>
  );
}
