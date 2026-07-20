"use client";

import { posthog } from "@rallly/posthog/client";
import { buttonVariants } from "@rallly/ui";
import Link from "next/link";
import { Trans } from "@/i18n/client/trans";
import { linkToApp } from "@/lib/linkToApp";

export function SignUpButton() {
  return (
    <Link
      href={linkToApp("/login")}
      className={buttonVariants({ variant: "primary" })}
      onClick={() => {
        posthog.capture("landing:sign_up_button_click");
      }}
    >
      <Trans i18nKey="signUp" defaults="Sign up" />
    </Link>
  );
}
