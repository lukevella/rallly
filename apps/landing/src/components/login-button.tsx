"use client";

import { usePostHog } from "@rallly/posthog/client";
import { buttonVariants } from "@rallly/ui";
import Link from "next/link";
import { Trans } from "@/i18n/client/trans";
import { linkToApp } from "@/lib/linkToApp";

export const LoginButton = () => {
  const posthog = usePostHog();
  return (
    <Link
      href={linkToApp("/login")}
      className={buttonVariants({ variant: "ghost" })}
      onClick={() => {
        posthog.capture("landing:login_button_click");
      }}
    >
      <Trans i18nKey="login" defaults="Login" />
    </Link>
  );
};
