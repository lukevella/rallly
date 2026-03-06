"use client";

import { usePostHog } from "@rallly/posthog/client";
import { buttonVariants } from "@rallly/ui/button";
import Link from "next/link";
import { Trans } from "@/i18n/client/trans";
import { linkToApp } from "@/lib/linkToApp";

export function SignUpButton() {
  const posthog = usePostHog();
  return (
    <Link
      href={linkToApp("/register")}
      className={buttonVariants({ variant: "primary" })}
      onClick={() => {
        posthog.capture("landing:sign_up_button_click");
      }}
    >
      <Trans i18nKey="signUp" defaults="Sign up" />
    </Link>
  );
}
